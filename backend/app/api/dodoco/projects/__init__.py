import app.api.dodoco.projects.projects as ddc_route_projects_main
import app.api.dodoco.projects.project_approve as ddc_route_projects_approve
import app.api.dodoco.projects.project_create_container as ddc_route_projects_cc

resource_route = {
    '/projects/<int:project_id>': {
        'view_func': ddc_route_projects_main.ProjectMainRoute,
        'base_path': '/projects/',
        'defaults': {'project_id': None}, },
    '/projects/<int:project_id>/approve': ddc_route_projects_approve.ProjectApproveRoute,
    '/projects/<int:project_id>/create-container': ddc_route_projects_cc.ProjectContainerCreationRoute,
}
