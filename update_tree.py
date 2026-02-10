import os

def generate_tree(start_path, output_file, title):
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"{title}\n\n")
        f.write(f"{os.path.basename(start_path)} (root)\n")
        
        for root, dirs, files in os.walk(start_path):
            # Sort naturally
            dirs.sort()
            files.sort()
            
            # Filter ignored directories
            dirs[:] = [d for d in dirs if d not in {
                '.git', '.idea', 'node_modules', 'dist', 'build', 'coverage', 
                '__pycache__', '.expo', '.venv', 'env', 'venv'
            }]
            
            # Calculate level and indentation
            level = root.replace(start_path, '').count(os.sep)
            indent = ' ' * 2 * (level)
            
            # Write files first (except for root, which we handled above)
            if root != start_path:
                dirname = os.path.basename(root)
                f.write(f"{indent}{dirname}/\n")
                sub_indent = ' ' * 2 * (level + 1)
            else:
                sub_indent = ''

            for file in files:
                if file in {'.DS_Store', 'Thumbs.db'}:
                    continue
                f.write(f"{sub_indent}- {file}\n")
            
            if root != start_path:
                 f.write("\n") # Add spacing after directory blocks if desired, or keep compact

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(base_dir, 'tf-backend')
frontend_dir = os.path.join(base_dir, 'tf-frontend')

backend_output = os.path.join(base_dir, 'tf_backend_tree.txt')
frontend_output = os.path.join(base_dir, 'tf_frontend_tree.txt')

print(f"Scanning {backend_dir}...")
generate_tree(backend_dir, backend_output, "tf-backend code tree:")
print(f"Generated {backend_output}")

print(f"Scanning {frontend_dir}...")
generate_tree(frontend_dir, frontend_output, "tf-frontend code tree:")
print(f"Generated {frontend_output}")
