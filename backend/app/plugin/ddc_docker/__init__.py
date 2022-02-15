import docker
import docker.client
import flask

docker_client: docker.client.DockerClient = None


def init_app(app: flask.Flask):
    global docker_client

    docker_base_url = app.config.get('DOCKER_BASE_URL', None)
    if docker_base_url:
        docker_client = docker.Client(docker_base_url)
    else:
        docker_client = docker.from_env()

    # TODO: Check container records on db are available on real machine
