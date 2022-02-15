import flask
import flask.views
import sqlalchemy as sql
import typing

import app.api.helper_class as api_class
import app.database as db_module
import app.database.jwt as jwt_module
import app.database.dodoco.project as ddc_db_project

from app.api.response_case import CommonResponseCase, ResourceResponseCase

db = db_module.db


class TagMainRoute(flask.views.MethodView, api_class.MethodViewMixin):
    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: False, }, )
    @api_class.RequestQuery(
        optional_fields={
            'show-disabled': {'type': 'boolean', },
            'name': {'type': 'string', }, }, )
    def get(self,
            req_query: dict,
            req_header: dict,
            access_token: typing.Optional[jwt_module.AccessToken] = None,
            tag_code: typing.Optional[str] = None):
        '''
        description: Returns tag information(s).
        responses:
            - multiple_resources_found
            - resource_found
            - resource_not_found
            - server_error
        '''
        try:
            show_disabled_query: bool = req_query.get('show-disabled', False)

            tag_query = db.session.query(ddc_db_project.ProjectTag)
            if not show_disabled_query:
                tag_query = tag_query.filter(ddc_db_project.ProjectTag.enabled.is_(True))
            if tag_code:
                tag_query = tag_query.filter(ddc_db_project.ProjectTag.code.like("%{}%".format(tag_code)))

            tag_result = tag_query.all()
            if not tag_result:
                return ResourceResponseCase.resource_not_found.create_response()
            if len(tag_result) == 1:
                return ResourceResponseCase.resource_found.create_response(
                    data={'tag': tag_result[0].to_dict(), }, )

            return ResourceResponseCase.multiple_resources_found.create_response(
                data={'tags': [tag.to_dict() for tag in tag_result], }, )

        except Exception:
            return CommonResponseCase.server_error.create_response()

    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    @api_class.RequestBody(
        required_fields={
            'name': {'type': 'string', },
            'code': {'type': 'string', }, },
        optional_fields={
            'description': {'type': 'string', }, }, )
    def post(self,
             req_header: dict,
             req_body: dict,
             access_token: jwt_module.AccessToken,
             tag_code: typing.Optional[str] = None):
        '''
        description: Register new tag. Only admin can create tag.
        responses:
            - resource_created
            - resource_unique_failed
            - http_mtd_forbidden
            - server_error
        '''
        try:
            # tag_code must not be given.
            if tag_code:
                return CommonResponseCase.http_mtd_forbidden.create_response()

            # Only admin can create tag.
            if not access_token.is_admin():
                return ResourceResponseCase.resource_forbidden.create_response()

            # Check if there's already a tag that has a same name, or enabled tag with same name
            tag_result = db.session.query(ddc_db_project.ProjectTag)\
                .filter(
                    sql.or_(
                        sql.and_(
                            ddc_db_project.ProjectTag.enabled.is_(True),
                            ddc_db_project.ProjectTag.name == req_body['name'], ),
                        ddc_db_project.ProjectTag.code == req_body['code'], ), ).all()
            if tag_result:
                # Find unique constraint failed fields
                unique_constraint_fail_field = list()
                if tag_result[0].code == req_body['code']:
                    unique_constraint_fail_field.append('code')
                if tag_result[0].name == req_body['name']:
                    unique_constraint_fail_field.append('name')
                return ResourceResponseCase.resource_unique_failed.create_response(
                    data={'duplicate': unique_constraint_fail_field})

            new_tag = ddc_db_project.ProjectTag()
            new_tag.name = req_body['name']
            new_tag.code = req_body['code']
            new_tag.description = req_body.get('description', None)

            db.session.add(new_tag)
            try:
                db.session.commit()
                return ResourceResponseCase.resource_created.create_response(
                    data={'tag': new_tag.to_dict(), }, )
            except Exception as err:
                db.session.rollback()
                raise err

        except Exception:
            return CommonResponseCase.server_error.create_response()

    @api_class.RequestHeader(auth={api_class.AuthType.Bearer: True, })
    def delete(self,
               req_header: dict,
               access_token: jwt_module.AccessToken,
               tag_code: typing.Optional[str] = None):
        '''
        description: Delete specific project. Only admin can do this.
        responses:
            - resource_deleted
            - resource_forbidden
            - resource_not_found
            - server_error
        '''
        try:
            # tag_code must be given.
            if not tag_code:
                return CommonResponseCase.http_mtd_forbidden.create_response()

            # Only admin can do this.
            if not access_token.is_admin():
                return ResourceResponseCase.resource_forbidden.create_response()

            # Find target query
            tag_result = db.session.query(ddc_db_project.ProjectTag)\
                .filter(ddc_db_project.ProjectTag.code == tag_code)\
                .filter(ddc_db_project.ProjectTag.enabled.is_(True))\
                .first()
            if not tag_result:
                return ResourceResponseCase.resource_not_found.create_response()

            tag_result.enabled = False
            try:
                db.session.commit()
                return ResourceResponseCase.resource_deleted.create_response()
            except Exception as err:
                db.session.rollback()
                raise err

        except Exception:
            return CommonResponseCase.server_error.create_response()
