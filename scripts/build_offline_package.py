import os
import subprocess
import shutil

build_dir = "/tmp/offline_pkg"
if os.path.exists(build_dir):
    shutil.rmtree(build_dir)
os.makedirs(build_dir)

# Ensure dist exists
dist_dir = "/app/applet/dist"
if not os.path.exists(dist_dir) or not os.path.exists(os.path.join(dist_dir, "index.html")):
    subprocess.run(["npm", "run", "build"], cwd="/app/applet", check=True)

# Copy dist files
for item in os.listdir(dist_dir):
    if item.endswith(".exe") or item.endswith(".zip"):
        continue
    s = os.path.join(dist_dir, item)
    d = os.path.join(build_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# Copy icon
shutil.copy2("/app/applet/public/app_icon.ico", os.path.join(build_dir, "app_icon.ico"))

# Copy templates
template_dir = "/app/applet/templates/desktop"
for item in os.listdir(template_dir):
    shutil.copy2(os.path.join(template_dir, item), os.path.join(build_dir, item))

# Package with 7za
if os.path.exists("/tmp/app_full.7z"):
    os.remove("/tmp/app_full.7z")
subprocess.run(["/tmp/tools/package/x64/7za", "a", "-t7z", "/tmp/app_full.7z", f"{build_dir}/*", "-mx9"], check=True)

# Build EXE with SFX
sfx_config = """;!@Install@!UTF-8!
Title="Gestão de Clientes e Vendas"
BeginPrompt="Deseja instalar a Gestão de Clientes e Vendas no seu computador?\\n\\n• 100% Silencioso (sem tela preta de CMD)\\n• Sem necessidade de Conta Google\\n• Funciona 100% Offline com Ícone Oficial"
RunProgram="wscript.exe //nologo Instalar_Atalho_Ambiente_Trabalho.vbs"
;!@InstallEnd@!
"""
with open("/tmp/sfx_cfg.txt", "w", encoding="utf-8") as f:
    f.write(sfx_config)

exe_path = "/app/applet/public/Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe"
with open(exe_path, "wb") as out_f:
    with open("/tmp/tools/7zSD.sfx", "rb") as sfx_f:
        out_f.write(sfx_f.read())
    with open("/tmp/sfx_cfg.txt", "rb") as cfg_f:
        out_f.write(cfg_f.read())
    with open("/tmp/app_full.7z", "rb") as z_f:
        out_f.write(z_f.read())

print("EXE generated successfully, size:", os.path.getsize(exe_path))

# Build ZIP
zip_path = "/app/applet/public/Gestao_Clientes_Vendas_PORTATIL.zip"
if os.path.exists(zip_path):
    os.remove(zip_path)
subprocess.run(["/tmp/tools/package/x64/7za", "a", "-tzip", zip_path, f"{build_dir}/*", "-mx9"], check=True)
print("ZIP generated successfully, size:", os.path.getsize(zip_path))

# Copy to dist so server serves them in production
shutil.copy2(exe_path, "/app/applet/dist/Instalador_Gestao_Clientes_Vendas_OFFLINE_Setup.exe")
shutil.copy2(zip_path, "/app/applet/dist/Gestao_Clientes_Vendas_PORTATIL.zip")
print("Files copied to dist successfully!")
