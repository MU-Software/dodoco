import flask
import flask.views
import typing

import app.common.utils as utils
import app.api.helper_class as api_class
import app.database as db_module
import app.database.jwt as jwt_module
import app.database.dodoco.project as ddc_db_project
import app.database.dodoco.container as ddc_db_container

from app.api.response_case import CommonResponseCase, ResourceResponseCase

db = db_module.db


class ContainerMainRoute(flask.views.MethodView, api_class.MethodViewMixin):
    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    @api_class.RequestQuery(
        optional_fields={
            'all': {'type': 'boolean', },
            'project-id': {'type': 'string', },
            'tag-code': {'type': 'string', }, }, )
    def get(self,
            req_header: dict,
            req_query: dict,
            access_token: jwt_module.AccessToken,
            container_id: typing.Optional[int] = None):
        '''
        description: Returns container information(s).
            You can specifiy projects or tags to query containers.
        responses:
            - multiple_resources_found
            - resource_found
            - resource_not_found
            - server_error
        '''
        try:
            query_all_projects = req_query.get('all', False)
            query_project_id = req_query.get('project-id', None)

            query_tag_code = utils.safe_json_loads(req_query.get('tag-code', None)) or req_query.get('tag_code', None)
            if query_tag_code is None:
                query_tag_code = None
            elif isinstance(query_tag_code, list):
                query_tag_code = [str(tag) for tag in query_tag_code]
            else:
                query_tag_code = str(query_tag_code)

            # 'all' option only allowed to admin
            if query_all_projects and not access_token.is_admin():
                return ResourceResponseCase.resource_forbidden.create_response()

            container_query = db.session.query(ddc_db_container.Container)
            container_result: list[ddc_db_container.Container] = list()

            if not container_id:
                # project_uuid_query = ddc_db_project.Project.query_builder(
                #     project_id=query_project_id, tag=query_tag_code,
                #     user_id=access_token.user, query_all=True,
                #     show_deleted=False, show_frozen=False,
                #     uuid_only=True
                # ).subquery()

                # container_query = container_query.filter(ddc_db_container.Container.uuid.in_(project_uuid_query))
                container_result = container_query.all()
            else:
                container_query = container_query.filter(ddc_db_container.Container.uuid == container_id)
                container_result = container_query.all()

                if container_result:
                    target_container = container_result[0]
                    target_project = target_container.project
                    projeect_members = target_project.members

                    has_auth = access_token.is_admin()
                    has_auth = has_auth or bool([m for m in projeect_members if m.user_id != access_token.user])
                    if not has_auth:
                        return ResourceResponseCase.resource_forbidden.create_response()

            if not container_result:
                return ResourceResponseCase.resource_not_found.create_response()
            return ResourceResponseCase.multiple_resources_found.create_response(
                data={'containers': [c.to_dict() for c in container_result], }, )

        except Exception:
            return CommonResponseCase.server_error.create_response()

    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    def delete(self,
               req_header: dict,
               access_token: jwt_module.AccessToken,
               container_id: typing.Optional[int] = None):
        '''
        description: Destroy and delete container.
            Only admin, project leader, or container creator can do this.
        responses:
            - multiple_resources_found
            - resource_found
            - resource_not_found
            - server_error
        '''
        try:
            # container_id must be given
            if not container_id:
                return CommonResponseCase.http_mtd_forbidden.create_response()

            target_container = db.session.query(ddc_db_container.Container)\
                .filter(ddc_db_container.Container.uuid == container_id)\
                .first()
            if not target_container:
                return ResourceResponseCase.resource_not_found.create_response()

            # Mark it as deleted and commit it
            try:
                target_container = target_container.check_existance(db_commit=True)
                if target_container:
                    target_container.destroy(force=True, db_commit=True)
                return ResourceResponseCase.resource_deleted.create_response()
            except Exception as err1:
                print(utils.get_traceback_msg(err1))
                db.session.rollback()
                return CommonResponseCase.db_error.create_response()
        except Exception as err:
            print(utils.get_traceback_msg(err))
            return CommonResponseCase.server_error.create_response()
