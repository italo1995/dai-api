import os
import sys
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
                            router_routes.append(route)
                            base_filename_raw = os.path.splitext(filename)[0]
                            if "Routes" in base_filename_raw:
                                base_filename = base_filename_raw.replace("Routes", "")
                            else:
                                base_filename = base_filename_raw.replace("Route", "")
                            formatted_filename = f"/api/{base_filename}/{route}"
                            rutas.append(formatted_filename)
                            global archivos
            archivos += 1
    return rutas

