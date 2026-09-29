# OficioAI — Despliegue en Vercel

## Paso 1: Sube el proyecto a GitHub

1. Crea una cuenta en github.com si no tienes
2. Crea un nuevo repositorio llamado "oficioai"
3. Sube todos los archivos de esta carpeta al repositorio

## Paso 2: Despliega en Vercel

1. Ve a vercel.com y regístrate con tu cuenta de GitHub
2. Haz clic en "Add New Project"
3. Selecciona el repositorio "oficioai"
4. Antes de desplegar, añade la variable de entorno:
   - Nombre: ANTHROPIC_API_KEY
   - Valor: (pega aquí tu API key de Anthropic)
5. Haz clic en "Deploy"

## Paso 3: Dominio personalizado (opcional)

1. Compra oficioai.com (o el dominio que prefieras) en namecheap.com (~10€/año)
2. En Vercel → Settings → Domains → añade tu dominio
3. Sigue las instrucciones de Vercel para apuntar los DNS

## Estructura del proyecto

```
oficioai/
├── api/
│   ├── generate.js    ← Genera bio, anuncios, respuestas WhatsApp
│   └── analyze.js     ← Medidor de compatibilidad de clientes
├── public/
│   └── index.html     ← La web completa (frontend)
├── package.json       ← Dependencias
├── vercel.json        ← Configuración de Vercel
└── README.md          ← Este archivo
```

## Costes

- Vercel: GRATIS (plan hobby)
- API Anthropic: ~$0.01-0.03 por generación
- Dominio: ~10€/año
