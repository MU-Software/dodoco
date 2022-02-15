# Import and add project routes here.
# If you want to make git not to track this file anymore,
# use `git update-index --skip-worktree app/api/project_route.py`
project_resource_routes = dict()

import app.api.dodoco as ddc_routes  # noqa
project_resource_routes.update(ddc_routes.resource_route)
