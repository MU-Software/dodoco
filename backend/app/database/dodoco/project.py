import datetime
import sqlalchemy.orm as sqlorm
import typing

import app.common.utils as utils
import app.database as db_module
import app.database.user as user_module

if typing.TYPE_CHECKING:
    from app.database.dodoco.container import Container

db = db_module.db


class ProjectTag(db.Model, db_module.DefaultModelMixin):
    __tablename__ = 'TB_PROJECT_TAG'
    uuid = db.Column(db_module.PrimaryKeyType, db.Sequence('SQ_ProjectTag_UUID'), primary_key=True)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    enabled = db.Column(db.Boolean, nullable=False, default=True)

    projects: list['Project'] = None  # backref placeholder

    def to_dict(self):
        return {
            'resource': 'project_tag',
            'uuid': self.uuid,
            'name': self.name,
            'code': self.code,
            'description': self.description,

            'created_at': self.created_at,
            'modified_at': self.modified_at,
            'modified': self.created_at != self.modified_at,
            'created_at_int': int(self.created_at.replace(tzinfo=datetime.timezone.utc).timestamp()),
            'modified_at_int': int(self.modified_at.replace(tzinfo=datetime.timezone.utc).timestamp()),
            'commit_id': self.commit_id,
        }


class Project(db.Model, db_module.DefaultModelMixin):
    __tablename__ = 'TB_PROJECT'
    uuid = db.Column(db_module.PrimaryKeyType, db.Sequence('SQ_Project_UUID'), primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    approved = db.Column(db.Boolean, nullable=True)
    max_container_limit = db.Column(db.Integer, nullable=False, default=0)

    tag_id = db.Column(db_module.PrimaryKeyType,
                       db.ForeignKey('TB_PROJECT_TAG.uuid', ondelete='CASCADE'),
                       nullable=True)
    tag: ProjectTag = db.relationship(ProjectTag, primaryjoin=tag_id == ProjectTag.uuid)

    created_by_id = db.Column(db_module.PrimaryKeyType,
                              db.ForeignKey('TB_USER.uuid', ondelete='CASCADE'),
                              nullable=True)
    created_by: user_module.User = db.relationship(user_module.User, primaryjoin=created_by_id == user_module.User.uuid)

    frozen_at = db.Column(db.DateTime, nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    containers: list['Container'] = None  # backref placeholder
    members: list['ProjectMember'] = None  # backref placeholder

    # DO NOT USE query AS METHOD NAME!
    # query is one of the db.Model's attribute name.
    @classmethod
    def query_builder(cls,
                      project_id: int = None,
                      tag: typing.Union[str, list[str], None] = None,
                      user_id: int = None,
                      query_all: bool = False,
                      show_deleted: bool = False,
                      show_frozen: bool = False,
                      uuid_only: bool = False) -> sqlorm.Query:
        if not query_all and user_id is None:
            raise Exception('One of user_id or query_all must be set')

        if uuid_only:
            project_query = db.session.query(cls.uuid)
        else:
            project_query = db.session.query(cls)

        if not show_deleted:
            project_query = project_query.filter(cls.deleted_at.is_(None))
        if not show_frozen:
            project_query = project_query.filter(cls.frozen_at.is_(None))

        # If query_all_projects not enabled, then limit query result to user-participated projects
        if not query_all:
            member_uuid_query = db.session.query(ProjectMember.project_id)\
                .filter(ProjectMember.user_id == user_id)\
                .distinct().subquery()
            project_query = project_query.filter(cls.uuid.in_(member_uuid_query))

        if project_id is None:
            # Apply tag on filter if tag query is available
            if tag:
                tag_uuid_query = db.session.query(ProjectTag.uuid)
                if isinstance(tag, list):
                    tag_uuid_query = tag_uuid_query.filter(ProjectTag.code.in_(tag))
                else:
                    tag_uuid_query = tag_uuid_query.filter(ProjectTag.code.like(tag))
                tag_uuid_query = tag_uuid_query.subquery()

                project_query = project_query.filter(cls.tag_id.in_(tag_uuid_query))

        else:
            project_query = project_query.filter(cls.uuid == project_id)

        return project_query

    def freeze(self, frozen_time: typing.Optional[datetime.datetime], commit: bool = False):
        if not frozen_time:
            frozen_time = datetime.datetime.utcnow().replace(tzinfo=utils.UTC)

        self.frozen_at = frozen_time

        if self.containers:
            for container in self.containers:
                if container:
                    container.destroy(False)

        if commit:
            db.session.commit()

    def to_dict(self, show_container: bool = True):
        result = {
            'resource': 'project',
            'uuid': self.uuid,
            'name': self.name,
            'description': self.description or '',
            'approved': self.approved if self.approved is not None else False,
            'max_container_limit': self.max_container_limit,

            'tag_id': self.tag_id,
            'tag': self.tag.to_dict(),

            'created_at': self.created_at,
            'modified_at': self.modified_at,
            'modified': self.created_at != self.modified_at,
            'created_at_int': int(self.created_at.replace(tzinfo=datetime.timezone.utc).timestamp()),
            'modified_at_int': int(self.modified_at.replace(tzinfo=datetime.timezone.utc).timestamp()),
            'commit_id': self.commit_id,
        }
        if show_container and self.containers:
            result['containers'] = [container.to_dict() for container in self.containers]
        if self.frozen_at:
            result['frozen_at'] = self.frozen_at
        if self.members:
            result['members'] = [member.to_dict() for member in self.members]

        return result


class ProjectMember(db.Model):
    __tablename__ = 'TB_PROJECT_MEMBER'
    uuid = db.Column(db_module.PrimaryKeyType, db.Sequence('SQ_ProjectMember_UUID'), primary_key=True)
    accepted = db.Column(db.Boolean, nullable=False, default=False)

    project_id = db.Column(db_module.PrimaryKeyType,
                           db.ForeignKey('TB_PROJECT.uuid', ondelete='CASCADE'),
                           nullable=False)
    project: Project = db.relationship(
                            Project,
                            primaryjoin=project_id == Project.uuid,
                            backref=db.backref('members'))

    user_id = db.Column(db_module.PrimaryKeyType,
                        db.ForeignKey('TB_USER.uuid', ondelete='CASCADE'),
                        nullable=False)
    user: user_module.User = db.relationship(user_module.User, primaryjoin=user_id == user_module.User.uuid)

    leader = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self) -> dict:
        result = {
            'resource': 'project_member',
            'uuid': self.uuid,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'user': self.user.to_dict(),
            'leader': self.leader
        }

        return result
