import os
import yaml

archivos = 0
rutas = []

def find_router_routes(directory):
    router_routes = []
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.endswith(".ts"):
                filepath = os.path.join(root, filename)
                with open(filepath, "r", encoding="utf-8") as file:
                    content = file.readlines()
                    for line in content:
                        if "router.route(" in line:
                            route_raw = line.split("router.route(")[1].split(")")[0]
                            route_raw_two = route_raw.strip("'")
                            route = route_raw_two.lstrip('/')
                            router_routes.append(route)
                            base_filename_raw = os.path.splitext(filename)[0]
                            base_filename = base_filename_raw.replace("Routes", "") if "Routes" in base_filename_raw else base_filename_raw.replace("Route", "")
                            formatted_filename = f"/api/{base_filename}/{route}"
                            rutas.append(formatted_filename)
                            global archivos
                            archivos += 1
    return rutas

def find_yaml_files(directory):
    yaml_files = []
    for root, _, files in os.walk(directory):
        for filename in files:
            if filename.lower().endswith((".yaml", ".yml")):
                filepath = os.path.join(root, filename)
                yaml_files.append(filepath)
    return yaml_files

def extract_routes_from_yaml(filepath):
    routes_yaml = []
    with open(filepath, "r") as file:
        content = yaml.safe_load(file)
        if "paths" in content:
            for path, methods in content["paths"].items():
                for method, _ in methods.items():
                    routes = f"{path}"
                    routes_yaml.append(routes)
    return routes_yaml

def find_missing_endpoints(formatted_file, yaml_file, output_file):
    with open(formatted_file, 'r') as file_formatted:
        endpoints_formatted = set(file_formatted.read().lower().splitlines())
    with open(yaml_file, 'r') as file_yaml:
        endpoints_yaml = set(file_yaml.read().lower().splitlines())
    missing_endpoints = endpoints_formatted - endpoints_yaml
    with open(output_file, 'w') as output:
        for endpoint in missing_endpoints:
            output.write(f"{endpoint}\n")
    return list(missing_endpoints)

if __name__ == "__main__":
    target_directory = "."
    formatted_file = "endpoints_formatted.txt"
    endpoints = find_router_routes(target_directory)
    with open(formatted_file, "w") as output:
        for endpoint in endpoints:
            output.write(f"{endpoint}\n")

    target_directory_yaml = "../documentation"
    yaml_file = "yaml_routes.txt"
    yaml_files = find_yaml_files(target_directory_yaml)
    with open(yaml_file, "w") as output:
        for yaml_file_path in yaml_files:
            routes = extract_routes_from_yaml(yaml_file_path)
            for route in routes:
                output.write(f"{route}\n")

    output_file = 'missing_endpoints.txt'
    missing_endpoints_list = find_missing_endpoints(formatted_file, yaml_file, output_file)

    print(f"Se encontraron {len(endpoints)} endpoints y {len(yaml_files)} archivos yaml.")