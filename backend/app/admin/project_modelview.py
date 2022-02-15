# Add custom plugins here.
# If you want to make git not to track this file anymore,
# use `git update-index --skip-worktree app/admin/project_modelview.py`
import flask_admin.contrib.sqla as fadmin_sqla
import app.database as db_module
import app.database.user as user
import app.database.jwt as jwt_module

import app.database.dodoco.project as ddc_db_project
import app.database.dodoco.container as ddc_db_container

target_flask_admin_modelview: list[fadmin_sqla.ModelView] = [
    fadmin_sqla.ModelView(user.User, db_module.db.session),
    fadmin_sqla.ModelView(user.EmailToken, db_module.db.session),
    fadmin_sqla.ModelView(jwt_module.RefreshToken, db_module.db.session),

    fadmin_sqla.ModelView(ddc_db_project.ProjectTag, db_module.db.session),
    fadmin_sqla.ModelView(ddc_db_project.Project, db_module.db.session),
    fadmin_sqla.ModelView(ddc_db_project.ProjectMember, db_module.db.session),
    fadmin_sqla.ModelView(ddc_db_container.Container, db_module.db.session),
    fadmin_sqla.ModelView(ddc_db_container.ContainerPort, db_module.db.session),
]
