import os
import yaml

archivos = 0
propi = []
propis = []
filtered_properties = []
services= []
property_name = []
property_new = []
required_properties = set()
property_all = []
propz = []
router_routes = []
base_filename = []
total_route = []
service_routes_dict = {}
property_mapping ={}
properties_by_service = {}
property_all_by_service = {}
total_route = {}
types = []
metodos = []
needs_auth = {}
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
                    print(file)
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
                            if "authMiddleware" in line:
                                needs_auth.setdefault(route, True)
                            else:
                                needs_auth.setdefault(route, False)
                            global archivos
            archivos += 1
    return router_routes, services, needs_auth

def find_property_models(directory):
    for root, _, files in os.walk(directory):
        for model in files:
            if model.endswith("Model.ts"):
                filepath = os.path.join(root, model)
                with open(filepath, "r", encoding = "utf-8") as file:
                    print(file)
                    content = file.read()
                    inside_interface = False
                    for line in content.splitlines():
                        if "export interface I" in line and "Attributes" in line:
                            model_name = line.split("I")[1].split("Attributes")[0].strip()
                            properties_by_service.setdefault(model_name, [])
                            property_all_by_service.setdefault(model_name, [])
                            inside_interface = True
                        elif inside_interface and ":" in line:
                            property_all = line
                            property_name = line.split(":")[0].strip()
                            property_new.append(property_all)
                            if property_name not in ["createdAt", "updatedAt", "deletedAt", "createdAt?", "updatedAt?", "deletedAt?"] and property_name not in properties_by_service[model_name]:
                                properties_by_service[model_name].append(property_name)
                            if property_name not in ["createdAt", "updatedAt", "deletedAt", "createdAt?", "updatedAt?", "deletedAt?"] and property_name not in property_all_by_service[model_name]:
                                property_all_by_service[model_name].append(property_all)
                        elif "}" in line:
                            inside_interface = False
    return properties_by_service, property_all_by_service

def filter_properties_for_service(service_name, properties_all):
    properties_for_service = []
    global propz
    for property_all_one in properties_all:
        prop = property_all_one.split(":")[0].strip()
        if prop[-1] != '?':
            propzi = prop.split("?")[0].strip()
            if propzi not in propz:
                propz.append(propzi)
            properties_for_service.append(property_all_one)
        else:
            global propis
            propi = prop.strip('?')
            aux = property_all_one.replace("?", "")
            properties_for_service.append(aux)
            propis.append(propi)
    return properties_for_service

def create_yaml_file(service_routes_dict, extracted_properties, needs_auth):
    global filtered_properties

    for service_name, routes in service_routes_dict.items():
        try:
            property_types = {}
            for key, tup in property_all_by_service.items():
                for prop in tup:
                    if isinstance(prop, str):
                        parts = prop.split(":")
                        if len(parts) >= 2:
                            prop_names = parts[0].strip()
                            prop_name = prop_names.replace("?", "")
                            prop_type = parts[1].strip()
                            property_types[prop_name] = prop_type
            global property_new
            formatted_service_name = service_name[0].lower() + service_name[1:]
            filtered_properties = filter_properties_for_service(service_name, property_all_by_service)
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
                                'schema': {'description': f'the {service_name} id', 'type': 'string'}
                            },
                        }
                    }
                }
            },
            'tags': [  
                    service_name
                    ],
            'paths': {}
            }
            for property_all_one in property_all_by_service.get(service_name, []):
                prop = property_all_one.split(":")[0].strip()
                if prop[-1] != '?':
                    yaml_data['components']['schemas'][service_name]['required'].append(prop)
                    yaml_data['components']['schemas'][service_name]['properties'][prop] = {
                        
                        'type': property_types.get(prop, []),
                        'description': f'the {prop} of the {formatted_service_name}'
                    }
                    required_properties.add(prop)
                else:
                    propi = prop.strip('?')
                    yaml_data['components']['schemas'][service_name]['properties'][propi] = {
                        'type': property_types.get(propi, []),
                        'description': f'the {propi} of the {formatted_service_name}'
                    }  
                for route, method in routes:
                    formatted_route = f"/api/{formatted_service_name}/{route}"
                    yaml_data['paths'].setdefault(formatted_route, {}).setdefault(method.lower(), {})
                    if route == 'all' :
                        if needs_auth.get(route, True):
                            yaml_data['paths'][formatted_route][method.lower()]['security'] = [{'BearerAuth': []}]
                        yaml_data['paths'][formatted_route][method.lower()]['summary'] = f"Returns a list of {formatted_service_name}"
                        yaml_data['paths'][formatted_route][method.lower()]['tags'] = [service_name]
                        yaml_data['paths'][formatted_route][method.lower()]['parameters'] = [
                            {
                                'in': 'query',
                                'name': 'pag',
                                'schema': {'type': 'number'},
                                'description': 'The page number to fetch'
                            },
                            {
                                'in': 'query',
                                'name': 'search',
                                'schema': {'type': 'string'},
                                'description': 'The keyword to filter by name'
                            }
                        ]
                    elif route == 'show':
                        if needs_auth.get(route, True):
                            yaml_data['paths'][formatted_route][method.lower()]['security'] = [{'BearerAuth': []}]
                        yaml_data['paths'][formatted_route][method.lower()]['summary'] = f"Returns a {formatted_service_name} element"
                        yaml_data['paths'][formatted_route][method.lower()]['tags'] = [service_name]
                        yaml_data['paths'][formatted_route][method.lower()]['parameters'] = [{'$ref': f'#/components/schemas/{service_name}/parameters/id'}]
                        yaml_data['paths'][formatted_route][method.lower()]['responses'] ={
                            '200': {
                                'description': f'The list of {formatted_service_name}',
                                'content':{ 
                                    'application/json': {
                                        'schema': {
                                            'type': 'Array', 
                                            'items': {
                                                '$ref': 
                                                    f'#/components/schemas/{service_name}'}
                                                
                                        }    
                                    }        
                                }
                            }
                                
                        }
                    elif route == 'store':  
                        properties_for_services = filter_properties_for_service(service_name, property_all_by_service.get(service_name, [])) 
                        properties_for_service = [prop for prop in properties_for_services if "id:" not in prop.lower()]
                        required_properties_for_service = []
                        for prop in propis:
                            if prop in propz and prop not in required_properties_for_service:
                                required_properties_for_service.append(prop) 
                        if needs_auth.get(route, True):
                            yaml_data['paths'][formatted_route][method.lower()]['security'] = [{'BearerAuth': []}]
                        yaml_data['paths'][formatted_route][method.lower()]['summary'] = f"Creates a new {formatted_service_name}"
                        yaml_data['paths'][formatted_route][method.lower()]['tags'] = [service_name]
                        properties_schema = {}
                        for prop in properties_for_service:
                            prop_names, prop_type = prop.split(":")
                            prop_name = prop_names.strip()
                            properties_schema[prop_name] = {
                                'type': property_types.get(prop_name, []),
                                'description': f'The {prop_name} of the {formatted_service_name}'
                                }
                        yaml_data['paths'][formatted_route][method.lower()]['requestBody'] = {
                            'required': True,
                            'content': {
                                'application/json': {
                                    'schema': {
                                        'type': 'object',
                                        'parameters': {
                                            'property': properties_schema,
                                            'required': required_properties_for_service
                                        }       
                                        
                                    }
                                }
                            }
                        }
                        yaml_data['paths'][formatted_route][method.lower()]['responses'] ={
                            '201': {
                                'description': f'The {formatted_service_name} created',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            '$ref': f'#/components/schemas/{service_name}'
                                        }
                                    }
                                }
                            }
                        }
                    elif route == 'update':
                        properties_for_service = filter_properties_for_service(service_name, property_all_by_service.get(service_name, [])) 
                        required_properties_for_service = []
                        for prop in propis:
                            if prop in propz and prop not in required_properties_for_service:
                                required_properties_for_service.append(prop)
                        for prop in propis:
                            if prop in propz and prop not in required_properties_for_service:
                                required_properties_for_service.append(prop) 
                        if needs_auth.get(route, True):
                            yaml_data['paths'][formatted_route][method.lower()]['security'] = [{'BearerAuth': []}]
                        yaml_data['paths'][formatted_route][method.lower()]['summary'] = f"Update a {route}"
                        yaml_data['paths'][formatted_route][method.lower()]['tags'] = [service_name]
                        properties_schema = {}
                        for prop in properties_for_service:
                            prop_names, prop_type = prop.split(":")
                            prop_name = prop_names.strip()
                            properties_schema[prop_name] = {
                                'type': property_types.get(prop_name, []),
                                'description': f'The {prop_name} of the {formatted_service_name}'
                                }
                        yaml_data['paths'][formatted_route][method.lower()]['requestBody'] = {
                            'required': True,
                            'content': {
                                'application/json': {
                                    'schema': {
                                        'parameters': {
                                            'property': properties_schema,
                                            'required': required_properties_for_service
                                        }
                                    }
                                }
                            }
                        }
                        yaml_data['paths'][formatted_route][method.lower()]['responses'] ={
                            '201': {
                                'description': f'The {formatted_service_name} updated',
                                'content': {
                                    'application/json': {
                                        'schema': {
                                            '$ref': f'#/components/schemas/{service_name}'
                                        }
                                    }
                                }
                            }
                        }
                    elif route == 'delete':
                        if needs_auth.get(route, True):
                            yaml_data['paths'][formatted_route][method.lower()]['security'] = [{'BearerAuth': []}]
                        yaml_data['paths'][formatted_route][method.lower()]['summary'] = f"Delete a {formatted_service_name}"
                        yaml_data['paths'][formatted_route][method.lower()]['tags'] = [service_name]
                        yaml_data['paths'][formatted_route][method.lower()]['parameters'] = [{'$ref': f'#/components/schemas/{service_name}/parameters/id'}]
                        yaml_data['paths'][formatted_route][method.lower()]['responses'] = {'201': {'description': f'The {service_name} deleted'}}
                    else:
                        if needs_auth.get(route, True):
                            yaml_data['paths'][formatted_route][method.lower()]['security'] = [{'BearerAuth': []}]
                        yaml_data['paths'][formatted_route][method.lower()]['summary'] = f"Endpoint for {route}"
                        yaml_data['paths'][formatted_route][method.lower()]['tags'] = [service_name]
                        yaml_data['paths'][formatted_route][method.lower()]['parameters'] = [{'$ref': f'#/components/schemas/{service_name}/parameters/id'}]
                        yaml_data['paths'][formatted_route][method.lower()]['responses'] = {'200': {'description': 'Success'}}
                        count = 0
            count += 1
            print(count)
        except Exception:
            print(f' no se pudo crear {service_name}')
                
        output_directory = "../documentation/"    
        output_path = os.path.join(output_directory, f"{service_name}.yaml")
        with open(output_path, "w", encoding="utf-8") as yaml_file:
            yaml.dump(yaml_data, yaml_file)

    

if __name__ == "__main__":
    target_directory = "../routes"
    model_directory = "../models"
    router_routes, services, needs_auth = find_router_routes(target_directory)
    extracted_properties, property_all_by_services = find_property_models(model_directory)
    
    for service_name in service_routes_dict.items():
        create_yaml_file(service_routes_dict, extracted_properties, needs_auth)
