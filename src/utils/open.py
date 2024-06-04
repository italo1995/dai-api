import yaml

# Información de ejemplo (reemplaza con tus datos reales)
endpoints = [
    {
        "path": "/api/banner/show",
        "method": "GET",
        "summary": "Returns a banner element",
        # ... otros detalles ...
    },
    # ... más endpoints ...
]

# Crear la estructura del archivo YAML
openapi_spec = {
    "openapi": "3.0.0",
    "info": {
        "title": "My API Documentation",
        "version": "1.0.0",
    },
    "paths": {},
}

# Agregar los endpoints al archivo YAML
for endpoint in endpoints:
    path = endpoint["path"]
    method = endpoint["method"].lower()
    summary = endpoint["summary"]
    # ... otros detalles ...

    if path not in openapi_spec["paths"]:
        openapi_spec["paths"][path] = {}
    openapi_spec["paths"][path][method] = {
        "summary": summary,
        # ... otros campos ...
    }

# Guardar el archivo YAML
with open("api_documentation.yaml", "w") as yaml_file:
    yaml.dump(openapi_spec, yaml_file)

print("Archivo YAML generado correctamente.")
