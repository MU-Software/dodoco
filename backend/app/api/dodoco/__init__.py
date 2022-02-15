import app.api.dodoco.tags as ddc_route_tags
import app.api.dodoco.projects as ddc_route_projects
import app.api.dodoco.containers as ddc_route_containers

resource_route = dict()
resource_route.update(ddc_route_tags.resource_route)
resource_route.update(ddc_route_projects.resource_route)
resource_route.update(ddc_route_containers.resource_route)
