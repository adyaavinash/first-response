import os
import glob
import osmnx as ox
import argparse 

def get_map_directory():
    parser = argparse.ArgumentParser(description="Pre-process OSM/PBF maps into GraphML format.")
    parser.add_argument("maps_dir", type=str, help="The full path to the directory containing your map files.")
    args = parser.parse_args()
    return os.path.abspath(args.maps_dir)

def create_graphml_files(maps_directory):
    """
    Finds all .osm or .pbf files in the given directory and creates
    a corresponding .graphml file for each one.
    """
    print(f"Searching for maps in: {maps_directory}")
    map_files = glob.glob(os.path.join(maps_directory, "*.osm*"))
    map_files.extend(glob.glob(os.path.join(maps_directory, "*.pbf")))

    if not map_files:
        print("No .osm or .pbf map files found to process.")
        return

    for map_path in map_files:
        region = os.path.basename(map_path).split('.')[0]
        graphml_file = os.path.join(maps_directory, f"{region}.graphml")

        if os.path.exists(graphml_file):
            print(f"✅ GraphML for {region} already exists. Skipping.")
            continue

        print(f"⏳ Processing {region} from {map_path}...")
        try:
            if map_path.endswith((".osm", ".xml")):
                print(f"   -> Parsing as OSM/XML file...")
                G = ox.graph_from_xml(map_path, simplify=True)
            elif map_path.endswith(".pbf"):
                print(f"   -> Parsing as PBF file...")
                G = ox.graph_from_pbf(map_path, simplify=True)
            else:
                print(f"   -> Skipping unsupported file type: {map_path}")
                continue

            ox.save_graphml(G, graphml_file)
            print(f"👍 Saved GraphML for {region} at {graphml_file}")
        except Exception as e:
            print(f"❌ Failed to process {region}: {e}")

if __name__ == "__main__":
    MAPS_DIR = get_map_directory()
    
    print("--- Starting Map Pre-processing ---")
    create_graphml_files(MAPS_DIR)
    print("--- Pre-processing Complete ---")