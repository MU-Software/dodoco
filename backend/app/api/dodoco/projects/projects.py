import datetime
import flask
import flask.views
import typing

import app.common.utils as utils
import app.api.helper_class as api_class
import app.database as db_module
import app.database.jwt as jwt_module
import app.database.dodoco.project as ddc_db_project

from app.api.response_case import CommonResponseCase, ResourceResponseCase

db = db_module.db


class ProjectMainRoute(flask.views.MethodView, api_class.MethodViewMixin):
    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    @api_class.RequestQuery(
        optional_fields={
            'all': {'type': 'boolean', },
            'show-deleted': {'type': 'boolean', },
            'show-frozen': {'type': 'boolean', },
            'tag-code': {'type': 'string', }, }, )
    def get(self,
            req_header: dict,
            req_query: dict,
            access_token: jwt_module.AccessToken,
            project_id: typing.Optional[int] = None):
        '''
        description: Returns project information(s).
            You can query projects by passing a project id, or passing a tag code.
        responses:
            - multiple_resources_found
            - resource_found
            - resource_not_found
            - server_error
        '''
        try:
            show_deleted = req_query.get('show-deleted', False)
            show_frozen = req_query.get('show-frozen', False)
            query_all_projects = req_query.get('all', False)

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

            project_query = ddc_db_project.Project.query_builder(
                project_id=project_id, tag=query_tag_code,
                user_id=access_token.user, query_all=query_all_projects,
                show_deleted=show_deleted, show_frozen=show_frozen,
                uuid_only=False)

            project_result = project_query.all()
            if not project_result:
                return ResourceResponseCase.resource_not_found.create_response(
                    data={'resource_name': ['project', ], }, )

            return ResourceResponseCase.multiple_resources_found.create_response(
                data={'projects': [proj.to_dict() for proj in project_result], }, )

        except Exception:
            return CommonResponseCase.server_error.create_response()

    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    @api_class.RequestBody(
        required_fields={
            'name': {'type': 'string', },
            'tag_code': {'type': 'string', }, },
        optional_fields={
            'description': {'type': 'string', }, }, )
    def post(self,
             req_header: dict,
             req_body: dict,
             access_token: jwt_module.AccessToken,
             project_id: typing.Optional[int] = None):
        '''
        description: Create new project
        responses:
            - resource_created
            - resource_unique_failed
            - http_mtd_forbidden
            - server_error
        '''
        try:
            # project_id must not be given
            if project_id:
                return CommonResponseCase.http_mtd_forbidden.create_response()

            new_project_name = req_body['name']
            new_project_tag_code = req_body['tag_code']
            new_project_description = req_body.get('description', None)

            # Project name must be unique on enabled tags
            enabled_tags_query = db.session.query(ddc_db_project.ProjectTag.uuid)\
                .filter(ddc_db_project.ProjectTag.enabled.is_(True)).subquery()
            project_name_dupcheck = db.session.query(ddc_db_project.Project)\
                .filter(ddc_db_project.Project.deleted_at.is_(None))\
                .filter(ddc_db_project.Project.frozen_at.is_(None))\
                .filter(ddc_db_project.Project.tag_id.in_(enabled_tags_query))\
                .filter(ddc_db_project.Project.name == new_project_name)\
                .all()
            if project_name_dupcheck:
                return ResourceResponseCase.resource_conflict.create_response(
                    data={'conflict_reason': ['UNIQUE:name'], }, )

            new_project_tag = db.session.query(ddc_db_project.ProjectTag)\
                .filter(ddc_db_project.ProjectTag.enabled.is_(True))\
                .filter(ddc_db_project.ProjectTag.code == new_project_tag_code)\
                .first()
            if not new_project_tag:
                return ResourceResponseCase.resource_not_found.create_response(
                    data={'resource_name': ['project_tag', ], }, )

            # Add new student
            new_project = ddc_db_project.Project()
            new_project.name = new_project_name
            new_project.tag = new_project_tag
            new_project.description = new_project_description
            new_project.created_by_id = access_token.user
            db.session.add(new_project)

            new_project_member = ddc_db_project.ProjectMember()
            new_project_member.project = new_project
            new_project_member.user_id = access_token.user
            new_project_member.leader = True
            new_project_member.accepted = True
            db.session.add(new_project_member)

            # And commit it
            try:
                db.session.commit()
                return ResourceResponseCase.resource_created.create_response(
                    data={
                        'project': new_project.to_dict(),
                        'project_members': [new_project_member.to_dict(), ],
                    }, )
            except Exception as err:
                db.session.rollback()
                err_reason, err_column_name = db_module.IntegrityCaser(err)
                if err_reason == 'FAILED_UNIQUE':
                    return ResourceResponseCase.resource_unique_failed.create_response(
                        data={'duplicate': [err_column_name, ]})
                else:
                    return CommonResponseCase.db_error.create_response()

        except Exception:
            return CommonResponseCase.server_error.create_response()

    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    def delete(self,
               req_header: dict,
               access_token: jwt_module.AccessToken,
               project_id: typing.Optional[int] = None):
        '''
        description: Delete specific project. Admin or project creator can do this.
        responses:
            - resource_deleted
            - resource_forbidden
            - resource_not_found
            - server_error
        '''
        try:
            # student_code must be given
            if not project_id:
                return CommonResponseCase.http_mtd_forbidden.create_response()

            # Find target project
            target_project = db.session.query(ddc_db_project.Project)\
                .filter(ddc_db_project.Project.deleted_at.is_(None))\
                .filter(ddc_db_project.Project.uuid == project_id)\
                .first()  # noqa
            if not target_project:
                return ResourceResponseCase.resource_not_found.create_response()

            # Check if user is admin or a creator of the project
            if not access_token.is_admin() and target_project.created_by_id != access_token.user:
                return ResourceResponseCase.resource_forbidden.create_response()

            # Mark it as deleted and commit it
            try:
                project_deleted_at = datetime.datetime.utcnow().replace(tzinfo=utils.UTC)
                target_project.freeze(project_deleted_at)
                target_project.deleted_at = project_deleted_at
                db.session.commit()
                return ResourceResponseCase.resource_deleted.create_response()
            except Exception:
                db.session.rollback()
                return CommonResponseCase.db_error.create_response()

        except Exception:
            return CommonResponseCase.server_error.create_response()
