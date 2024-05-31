import os
import yaml
archivos = 0
services= []
router_routes = []
base_filename = []
total_route = []
service_routes_dict = {}
property_mapping ={}
properties_by_service = {}
total_route = {}
metodos = []
yaml_service_data ={
    'type' : 'object',
    'properties' : {}
}


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
                            method = line.split("').")[1].split("(")[0]
                            metodos.append(method)
                            route_raw_two = route_raw.strip("'")
                            route = route_raw_two.lstrip('/')
                            router_routes.append(route)
                            base_filename_raw = os.path.splitext(filename)[0]
                            base_filename = base_filename_raw.replace("Routes", "") if "Routes" in base_filename_raw else base_filename_raw.replace("Route", "")
                            services.append(base_filename)
                            route_method_tuple = (route, method)
                            total_route.setdefault(route_method_tuple, set()).add(method)
                            service_routes_dict.setdefault(base_filename, set()).add(route_method_tuple)
                            
                            global archivos
            archivos += 1
    return router_routes, services

def find_property_models(directory):
    for root, _, files in os.walk(directory):
        for model in files:
            if model.endswith("Model.ts"):
                filepath = os.path.join(root, model)
                with open(filepath, "r", encoding = "utf-8") as file:
                    content = file.read()
                    inside_interface = False
                    for line in content.splitlines():
                        if "export interface I" in line and "Attributes" in line:
                            model_name = line.split("I")[1].split("Attributes")[0].strip()
                            properties_by_service.setdefault(model_name, [])
                            inside_interface = True
                        elif inside_interface and ":" in line:
                            property_name = line.split(":")[0].strip()
                            if property_name not in ["createdAt", "updatedAt", "deletedAt", "createdAt?", "updatedAt?", "deletedAt?"] and property_name not in properties_by_service[model_name]:
                                properties_by_service[model_name].append(property_name)
                        elif "}" in line:
                            inside_interface = False
                            
    return properties_by_service



def create_yaml_file(service_routes_dict, extracted_properties):
    for service_name, routes in service_routes_dict.items():
        yaml_data = {
        'components': {
            'schemas': {
                service_name: {
                    'type': 'object',
                    'properties': {},
                    'required': [],
                    'parameters': {
                        'id': {
                            'in': 'query',
                            'name': 'id',
                            'required': True,
                            'schema': {'type': 'string', 'description': f'the {service_name} id'}
                        }
                    }
                }
            }
        },
        'tags': [{'name': f'{service_name}', 'description': f'{service_name} endpoint'}],
        'paths': {}
        }
        for prop in extracted_properties.get(service_name, []):
            yaml_data['components']['schemas'][service_name]['properties'][prop] = {
                'type': 'string',
                'description': f'the {prop} of the {service_name}'
            }
            if prop[-1] != '?':
                yaml_data['components']['schemas'][service_name]['required'].append(prop)
            
                
        for route, method in routes:
            formatted_route = f"/api/{service_name}/{route}"
            yaml_data['paths'].setdefault(formatted_route, {}).setdefault(method.lower(), {})['summary'] = f"Endpoint for {route}"
            yaml_data['paths'][formatted_route][method.lower()]['tags'] = [f'{service_name}']
            yaml_data['paths'][formatted_route][method.lower()]['parameters'] = [{'$ref': f'#/components/schemas/{service_name}/parameters/id'}]
            yaml_data['paths'][formatted_route][method.lower()]['responses'] = {'200': {'description': 'Success'}}
            
            
        
        output_directory = "../documentation/pruebas/"    
        output_path = os.path.join(output_directory, f"{service_name}.yaml")
        with open(output_path, "w", encoding="utf-8") as yaml_file:
            yaml.dump(yaml_data, yaml_file)

    for model_property, service_property in property_mapping.items():
        yaml_service_data['properties'][service_property] = {
            'type': 'string',
            'description': f'the {service_name} of the {model_property}'
        }
    yaml_data['components']['schemas'][service_name]['required'] = yaml_service_data

if __name__ == "__main__":
    target_directory = "../routes/"
    model_directory = "../models/"
    router_routes, services = find_router_routes(target_directory)
    extracted_properties = find_property_models(model_directory)
    
    for service_name in service_routes_dict.items():
        create_yaml_file(service_routes_dict, extracted_properties)
    
    #print(f"Se han generado archivos YAML para {archivos} servicios.")
    print(service_routes_dict)