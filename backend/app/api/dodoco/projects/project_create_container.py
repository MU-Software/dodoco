import flask
import flask.views
import pathlib as pt
import tempfile
import typing

import app.common.utils as utils
import app.api.helper_class as api_class
import app.database as db_module
import app.database.jwt as jwt_module
import app.database.dodoco.project as ddc_db_project
import app.database.dodoco.container as ddc_db_container

from app.api.response_case import CommonResponseCase, ResourceResponseCase

db = db_module.db


class ProjectContainerCreationRoute(flask.views.MethodView, api_class.MethodViewMixin):
    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    @api_class.RequestBody(
        required_fields={
            'name': {'type': 'string', },
            'image_name': {'type': 'string', }, },
        optional_fields={
            'description': {'type': 'string', }, }, )
    def post(self,
             project_id: int,
             req_header: dict,
             access_token: jwt_module.AccessToken,
             req_body: dict):
        '''
        description: Create container of project. Only admin or project member can do this.
        responses:
            - multiple_resources_found
            - resource_found
            - resource_not_found
            - server_error
        '''
        try:
            container_name: str = req_body['name']
            container_start_image: str = req_body['image_name']
            container_description: typing.Optional[str] = req_body.get('description', None)

            target_project = db.session.query(ddc_db_project.Project)\
                .filter(ddc_db_project.Project.deleted_at.is_(None))\
                .filter(ddc_db_project.Project.frozen_at.is_(None))\
                .filter(ddc_db_project.Project.uuid == project_id)\
                .first()
            if not target_project:
                return ResourceResponseCase.resource_not_found.create_response(
                    data={'resource_name': ['project', ], }, )
            if not target_project.approved:
                return ResourceResponseCase.resource_forbidden.create_response(
                    message='프로젝트가 승인되지 않았습니다.')

            target_project_member = db.session.query(ddc_db_project.ProjectMember)\
                .filter(ddc_db_project.ProjectMember.project_id == target_project.uuid)\
                .filter(ddc_db_project.ProjectMember.user_id == access_token.user)\
                .all()
            # Check if requested user is admin or a project member
            if not access_token.is_admin() and not target_project_member:
                return ResourceResponseCase.resource_forbidden.create_response(
                    message='프로젝트의 컨테이너를 생성할 권한이 없습니다.')

            if len(target_project.containers) >= target_project.max_container_limit:
                return ResourceResponseCase.resource_conflict.create_response(
                    message='생성할 수 있는 컨테이너 개수를 초과했습니다.',
                    data={'conflict_reason': ['CONTAINER_COUNT_LIMIT', ], }, )

            # Now, create a container
            # restrict docker image to ubuntu, cuz this is just a prototype
            docker_image_whitelist = {
                'ubuntu': {
                    'ports': [
                        '22/all',  # ssh
                    ],
                },
                # 'alpine',
                # 'debian',
                # 'centos',
                # 'fedora',
                # 'amazonlinux',
            }
            image_version = 'latest'
            image_name_split = container_start_image.split(':')
            image_base_name = image_name_split[0]
            if 1 < len(image_name_split):
                image_version = image_name_split[1]

            if image_base_name not in docker_image_whitelist:
                return CommonResponseCase.body_bad_semantics.create_response(
                            message='현재 지원되는 Docker 이미지가 아닙니다.',
                            data={'bad_semantics': [{
                                'field': 'image',
                                'reason': f'Currently supported images are <{", ".join(docker_image_whitelist)}>.',
                            }, ], }, )
            image_name = f'{image_base_name}:{image_version}'

            # Add new container
            new_container = ddc_db_container.Container()
            new_container.name = container_name
            new_container.description = container_description
            new_container.project_id = target_project.uuid
            new_container.created_by_id = access_token.user
            db.session.add(new_container)
            db.session.commit()

            docker_info = docker_image_whitelist['ubuntu']
            for port_info in docker_info['ports']:
                container_port_num, target_port_protocol = port_info.split('/')
                container_port_num = int(container_port_num)
                exposed_port_num = utils.find_free_random_port()
                port_protocols = ('tcp', 'udp', ) if target_port_protocol == 'all' else (target_port_protocol, )

                for port_protocol in port_protocols:
                    new_container.add_port_mapping(
                        container_port=container_port_num,
                        exposed_port=exposed_port_num,
                        protocol=ddc_db_container.DockerPortProtocol[port_protocol],
                        db_commit=False)
                db.session.commit()

            new_container.create(
                image_name,
                start_after_create=True,
                db_commit=False)
            db.session.commit()

            try:
                tmp_script_file = tempfile.NamedTemporaryFile('w', suffix='.sh', delete=False)
                setup_script_file = pt.Path.cwd() / 'app/plugin/ddc_docker/docker_setup_script' / 'ubuntu.sh'
                setup_script = setup_script_file.open('r').read().format(
                    TARGET_USERNAME='musoftware',
                    TARGET_PASSWORD='qwerty!0')
                print(pt.Path(tmp_script_file.name).open('w').write(setup_script))

                tmpfile_pt = pt.Path(tmp_script_file.name)
                new_container.push_local_file(tmpfile_pt, '/tmp/')
                print(tmpfile_pt.name)
                # new_container.execute_cmd('sh /tmp/' + tmpfile_pt.name, stream=True, demux=False)
            except Exception as err:
                print(utils.get_traceback_msg(err))

            try:
                db.session.commit()
                return ResourceResponseCase.resource_created.create_response(
                    data={'container': new_container.to_dict(), }, )
            except Exception as err:
                db.session.rollback()
                err_reason, err_column_name = db_module.IntegrityCaser(err)
                if err_reason == 'FAILED_UNIQUE':
                    return ResourceResponseCase.resource_unique_failed.create_response(
                        data={'duplicate': [err_column_name, ]})
                else:
                    return CommonResponseCase.db_error.create_response()

        except Exception as err:
            print(utils.get_traceback_msg(err))
            return CommonResponseCase.server_error.create_response()
