import app.api.dodoco.tags.tags as ddc_route_tags_main

resource_route = {
    '/tags/<string:tag_code>': {
        'view_func': ddc_route_tags_main.TagMainRoute,
        'base_path': '/tags/',
        'defaults': {'tag_code': None}, },
}
