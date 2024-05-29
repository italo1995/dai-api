import os
from openapi3 import OpenAPI
import yaml


archivos = 0
rutas = []

def find_router_routes(directory):
    router_routes = []
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith(".ts"):
                
                filepath = os.path.join(root, filename)
                with open(filepath, "r") as file:
                    content = file.readlines()
                    for line in content:
                        if "router.route(" in line:
                            route_raw = line.split("router.route(")[1].split(")")[0]
                            route_raw_two = route_raw.strip("'")
                            route = route_raw_two.lstrip('/')
                            print(route)
                            router_routes.append(route)
                            base_filename = os.path.splitext(filename)[0]
                            print(base_filename)
                            formatted_filename = f"/api/{base_filename}/{route}"
                            rutas.append(formatted_filename)
                            global archivos
            archivos += 1
    return rutas

if __name__ == "__main__":
    target_directory = "."
    formatted_file = "endpoints_formatted.txt"

    endpoints = find_router_routes(target_directory)

    with open(formatted_file, "w") as output:
        for endpoint in endpoints:
            output.write(f"{endpoint}\n")


print(f"Se encontraron {len(endpoints)} endpoints. Resultados guardados, de {archivos} archivos revisados.")

with open('openapi.yaml') as f:
    spec = yaml.safe_load(f.read())
    
api = OpenAPI(spec)

def get_endpoints(api):
    endpoints = []
    for path, methods in api.paths.items():
        for method, operation in methods.items():
            endpoints.append((method, path))
    return endpoints

all_endpoints = get_endpoints(api)

for method, path in all_endpoints:
    print(f"{method}: {path}")