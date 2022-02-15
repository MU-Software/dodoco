# Add custom plugins here.
# If you want to make git not to track this file anymore,
# use `git update-index --skip-worktree app/plugin/__init__.py`

import flask
import app.plugin.ddc_docker as ddc_plugin_docker


def init_app(app: flask.Flask):
    ddc_plugin_docker.init_app(app)
