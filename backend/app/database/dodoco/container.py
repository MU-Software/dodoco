import datetime
import docker
import docker.errors
import docker.models.containers
import docker.models.images
import enum
import pathlib as pt
import secrets
import tarfile
import tempfile
import typing

import app.database as db_module
import app.database.user as user_module
import app.database.dodoco.project as ddc_db_project
import app.plugin.ddc_docker as ddc_plugin_docker

DockerClientType = docker.client.DockerClient
DockerContainerType = docker.models.containers.Container
DockerImageType = docker.models.images.Image

db = db_module.db
docker_client = ddc_plugin_docker.docker_client


class DockerPortProtocol(enum.Enum):
    # protocol name must be lowercase
    tcp = enum.auto()
    udp = enum.auto()
    stcp = enum.auto()


class Container(db.Model, db_module.DefaultModelMixin):
    __tablename__ = 'TB_CONTAINER'
    uuid = db.Column(db_module.PrimaryKeyType, db.Sequence('SQ_Container_UUID'), primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)
    information = db.Column(db.String, nullable=True)

    start_image_name = db.Column(db.String, nullable=True)
    container_id = db.Column(db.String, nullable=True)
    container_name = db.Column(db.String, nullable=True, unique=True)

    project_id = db.Column(db_module.PrimaryKeyType,
                           db.ForeignKey('TB_PROJECT.uuid', ondelete='CASCADE'),
                           nullable=False)
    project: ddc_db_project.Project = db.relationship(
                            ddc_db_project.Project,
                            primaryjoin=project_id == ddc_db_project.Project.uuid,
                            backref=db.backref('containers'))

    created_by_id = db.Column(db_module.PrimaryKeyType,
                              db.ForeignKey('TB_USER.uuid', ondelete='CASCADE'),
                              nullable=True)
    created_by: user_module.User = db.relationship(user_module.User, primaryjoin=created_by_id == user_module.User.uuid)

    ports: list['ContainerPort'] = None  # backref placeholder

    def create(self,
               image_name: str,
               run_kwargs: typing.Optional[dict] = None,
               setup_container_function: typing.Optional[typing.Callable] = None,
               start_after_create: bool = False,
               db_commit: bool = False) -> DockerContainerType:

        self.start_image_name = image_name
        self.container_name = f'{[z for z in image_name.split(":") if z][0]}_{secrets.token_hex(16)}'
        container_run_kwargs_result = {
            **(run_kwargs or {}),
            'name': self.container_name,
            'detach': True, 'stdin_open': True, 'tty': True,  # -dit
            'network_mode': 'bridge', 'ports': self.get_container_ports(),
        }
        new_container: DockerContainerType = None

        try:
            global docker_client
            docker_client = ddc_plugin_docker.docker_client
            new_container = docker_client.containers.create(image_name, **container_run_kwargs_result)
        except (docker.errors.ImageNotFound, docker.errors.APIError):
            new_image = docker_client.images.pull(image_name)  # noqa
            new_container = docker_client.containers.create(new_image.tags[0], **container_run_kwargs_result)

        self.container_id = new_container.id

        if setup_container_function:
            setup_container_function(new_container)

        if start_after_create:
            new_container.start()

        if db_commit:
            db.session.commit()

    def recreate(self, start_after_recreate: bool = False, db_commit: bool = False):
        target_image: DockerImageType = None
        try:
            self.get_container_obj().remove()
        except Exception:
            pass

        try:
            target_image = docker_client.images.get(self.container_name)
        except docker.errors.ImageNotFound:
            target_image = docker_client.images.get(self.start_image_name)

        target_container: DockerContainerType = docker_client.containers.create(
            image=target_image.tags[0],
            name=self.container_name,
            detach=True, stdin_open=True, tty=True,  # -dit
            network_mode='bridge', ports=self.get_container_ports())
        self.container_id = target_container.id

        if start_after_recreate:
            target_container.start()

        if db_commit:
            db.session.commit()

    def get_container_obj(self) -> DockerContainerType:
        return docker_client.containers.get(self.container_id)

    def start(self):
        try:
            target_container = self.get_container_obj()
            target_container.start()
        except docker.errors.NotFound:
            self.recreate(start_after_recreate=True, db_commit=True)

    def pause(self):
        target_container = self.get_container_obj()
        target_container.pause()

    def stop(self, immediate: bool = False, blocking: bool = True, timeout: int = 10):
        target_container = self.get_container_obj()
        if immediate:
            target_container.kill()
        elif blocking:
            target_container.wait(timeout=timeout)
        else:
            target_container.stop(timeout=timeout)

    def restart(self, timeout: int = 10):
        target_container = self.get_container_obj()
        target_container.restart(timeout=timeout)

    def destroy(self, force: bool = False, db_commit: bool = False):
        self.stop(force, blocking=True)
        target_container = self.get_container_obj()
        target_container.remove()

        # Remove all port records
        db.session.query(ContainerPort).filter(ContainerPort.container_id == self.uuid).delete()

        # Remove self
        db.session.delete(self)

        if db_commit:
            db.session.commit()

    def commit(self, changes: str = None, start_after_commit: bool = False, db_commit: bool = False):
        # if the container is runnig, then we should stop first
        try:
            self.stop(blocking=True)
        except Exception:
            try:
                self.stop(immediate=True)
            except Exception:
                pass

        # We need to commit with same container name,
        # (then new image with container name will be generated,)
        # and start new image.
        target_container = self.get_container_obj()
        target_image = target_container.image
        target_image_tag_split = target_image.tags[0].split(':')
        target_image_name = target_image_tag_split[0]
        target_image_tag = target_image_tag_split[1]

        new_image_name = target_image_name
        container_commit_num: int = -1
        if self.start_image_name == target_container.image.tags[0]:
            container_commit_num = 0
            new_image_name = self.container_name
        else:
            container_commit_num = int(target_image_tag) + 1

        # Commit and create new image
        target_container = self.get_container_obj()
        target_container.commit(
            repository=new_image_name,
            changes=changes,
            tag=container_commit_num)

        # Remove old container and create new
        target_container.remove()
        self.recreate()

        if start_after_commit:
            self.start()

        if db_commit:
            db.session.commit()

    def push_local_file(self, local_file_path: pt.Path, dest_path: str):
        target_container = self.get_container_obj()

        with tempfile.NamedTemporaryFile('wb', suffix='.tar', delete=False) as f:
            with tarfile.open(fileobj=f, mode='w') as tar:
                try:
                    tar.add(local_file_path)
                    print(tar.list())
                finally:
                    tar.close()

            with pt.Path(f.name).open('rb') as fp:
                target_container.put_archive(dest_path, fp.read())

    def execute_cmd(self, cmdline: str, stream: bool = False, demux: bool = True):
        target_container = self.get_container_obj()
        return target_container.exec_run(cmdline, stream, demux)

    def add_port_mapping(self,
                         container_port: int,
                         exposed_port: int,
                         protocol: DockerPortProtocol,
                         start_after_add: bool = False,
                         db_commit: bool = False):

        new_port = ContainerPort()
        new_port.container_id = self.uuid
        new_port.container_port = container_port
        new_port.exposed_port = exposed_port
        new_port.protocol = protocol
        db.session.add(new_port)

        if db_commit:
            db.session.commit()

        if self.container_id:
            self.commit(start_after_add, db_commit)

    def check_existance(self, db_commit=False) -> typing.Optional['Container']:
        try:
            # Check if docker container alive
            global docker_client
            docker_client = ddc_plugin_docker.docker_client
            docker_client.containers.get(self.container_id)
            return self
        except docker.errors.NotFound:
            if db_commit:
                db.session.query(ContainerPort).filter(ContainerPort.container_id == self.uuid).delete()
                db.session.delete(self)
                db.session.commit()
            return None
        except Exception as err:
            raise err

    def get_container_ports(self) -> dict[str, int]:
        ports: dict[str, int] = dict()
        container_port_records = db.session.query(ContainerPort)\
            .filter(ContainerPort.container_id == self.uuid).all()
        for container_port_record in container_port_records:
            ports.update(container_port_record.to_docker_port_def())
        return ports

    def to_dict(self):
        result = {
            'resource': 'container',
            'uuid': self.uuid,
            'name': self.name,

            'start_image_name': self.start_image_name,
            'container_id': self.container_id,
            'container_name': self.container_name,

            'created_by_id': self.created_by_id,
            'created_by': self.created_by.to_dict(),
            'created_at': self.created_at,
            'modified_at': self.modified_at,
            'modified': self.created_at != self.modified_at,
            'created_at_int': int(self.created_at.replace(tzinfo=datetime.timezone.utc).timestamp()),
            'modified_at_int': int(self.modified_at.replace(tzinfo=datetime.timezone.utc).timestamp()),
            'commit_id': self.commit_id,
        }
        if self.project:
            result['project'] = self.project.to_dict(show_container=False)
        if self.ports:
            result['ports'] = [port.to_dict() for port in self.ports]

        return result


class ContainerPort(db.Model):  # Container's exposed port management
    __tablename__ = 'TB_CONTAINER_PORT'
    uuid = db.Column(db_module.PrimaryKeyType, db.Sequence('SQ_ContainerPort_UUID'), primary_key=True)

    container_id = db.Column(db_module.PrimaryKeyType,
                             db.ForeignKey('TB_CONTAINER.uuid', ondelete='CASCADE'),
                             nullable=False)
    container: Container = db.relationship(
                                Container,
                                primaryjoin=container_id == Container.uuid,
                                backref=db.backref('ports'))

    container_port = db.Column(db.Integer, nullable=False)
    protocol = db.Column(db.Enum(DockerPortProtocol), nullable=False, default=DockerPortProtocol.tcp)
    # exposed_port column must not be unique,
    # because there's a case that container port with multiple protocols exposed.
    exposed_port = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            'resource': 'container_port',
            'protocol': self.protocol.name,  # tcp, udp, stcp
            'container_port': self.container_port,
            'exposed_port': self.exposed_port,
        }

    def to_docker_port_def(self) -> dict[str, int]:
        return {f'{self.container_port}/{self.protocol.name}': self.exposed_port, }
