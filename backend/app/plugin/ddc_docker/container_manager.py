import docker
import docker.errors
import docker.models.containers
import typing

DockerClientType = docker.client.DockerClient
DockerContainerType = docker.models.containers.Container


def create_os_container(
        client: DockerClientType,
        image_name: str,
        run_kwargs: dict,
        ports: typing.Optional[dict[str, int]] = None,
        setup_os_function: typing.Optional[typing.Callable] = None) -> DockerContainerType:

    container_run_kwargs_result = {
        **run_kwargs,
        'detach': True, 'stdin_open': True, 'tty': True,  # -dit
        'network_mode': 'bridge', 'ports': ports,
    }
    new_container: DockerContainerType = None

    try:
        new_container = client.containers.run(image_name, **container_run_kwargs_result)
    except docker.errors.ImageNotFound:
        new_image = client.images.pull(image_name)  # noqa
        new_container = client.containers.run(image_name, **container_run_kwargs_result)

    if setup_os_function:
        setup_os_function(new_container)

    return new_container


def setup_additional_ubuntu_env(container: DockerContainerType):
    # OK, we need to connect with container first
    container.attach

    # Set up apt-get

    # Set up ssh. We won't setup ftp. Use SFTP

    # Reboot

    container.restart()  # hard reboot

    pass


def add_ports_on_existing_container(container: DockerContainerType):
    pass
