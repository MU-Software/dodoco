import app.api.dodoco.containers.containers as ddc_route_containers_main

resource_route = {
    '/containers/<int:container_id>': {
        'view_func': ddc_route_containers_main.ContainerMainRoute,
        'base_path': '/containers/',
        'defaults': {'container_id': None}, },
}
