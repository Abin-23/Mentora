with open("ai_client.py", "r") as f:
    lines = f.readlines()

for i in range(84, 187):
    # lines 85 to 187 (0-indexed 84 to 186)
    if not lines[i].startswith("        except") and not lines[i].startswith("    # If all keys"):
        if lines[i].startswith("            "):
            lines[i] = "    " + lines[i]
        elif lines[i].startswith("        "):
            lines[i] = "    " + lines[i]

for i in range(238, 287):
    if lines[i].startswith("            "):
        lines[i] = "    " + lines[i]
    elif lines[i].startswith("        "):
        lines[i] = "    " + lines[i]

with open("ai_client.py", "w") as f:
    f.writelines(lines)
