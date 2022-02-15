import flask
import flask.views
import typing

import app.api.helper_class as api_class
import app.database as db_module
import app.database.jwt as jwt_module
import app.database.dodoco.project as ddc_db_project

from app.api.response_case import CommonResponseCase, ResourceResponseCase

db = db_module.db


class ProjectApproveRoute(flask.views.MethodView, api_class.MethodViewMixin):
    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    def put(self, project_id: int, req_header: dict, access_token: jwt_module.AccessToken):
        '''
        description: Approve project. Only admin can do this.
        responses:
            - resource_modified
            - resource_forbidden
            - resource_not_found
            - server_error
        '''
        try:
            if not access_token.is_admin():
                return ResourceResponseCase.resource_forbidden.create_response()

            project_query = ddc_db_project.Project.query_builder(
                project_id=project_id, tag=None,
                user_id=None, query_all=True,
                show_deleted=False, show_frozen=False, uuid_only=False)

            project_result: typing.Optional[ddc_db_project.Project] = project_query.first()
            if not project_result:
                return ResourceResponseCase.resource_not_found.create_response(
                    data={'resource_name': ['project', ], }, )

            try:
                project_result.approved = True
                db.session.commit()
                return ResourceResponseCase.resource_modified.create_response(
                    data={'project': project_result.to_dict(), }, )
            except Exception:
                db.session.rollback()
                return CommonResponseCase.db_error.create_response()

        except Exception:
            return CommonResponseCase.server_error.create_response()

    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    def delete(self, project_id: int, req_header: dict, access_token: jwt_module.AccessToken):
        '''
        description: Disapprove project. Only admin can do this.
        responses:
            - resource_created
            - resource_unique_failed
            - http_mtd_forbidden
            - server_error
        '''
        try:
            if not access_token.is_admin():
                return ResourceResponseCase.resource_forbidden.create_response()

            project_query = ddc_db_project.Project.query_builder(
                project_id=project_id, tag=None,
                user_id=None, query_all=True,
                show_deleted=False, show_frozen=False, uuid_only=False)

            project_result: typing.Optional[ddc_db_project.Project] = project_query.first()
            if not project_result:
                return ResourceResponseCase.resource_not_found.create_response(
                    data={'resource_name': ['project', ], }, )

            try:
                project_result.approved = False
                db.session.commit()
                return ResourceResponseCase.resource_modified.create_response(
                    data={'project': project_result.to_dict(), }, )
            except Exception:
                db.session.rollback()
                return CommonResponseCase.db_error.create_response()

        except Exception:
            return CommonResponseCase.server_error.create_response()
