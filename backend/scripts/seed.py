"""
Carga datos demo: categorías, bicicletas y usuario de prueba.

Los productos y rutas `/images/catalog/...` se generan a partir de los PNG reales en
`frontend/public/images/catalog/{ciudad,montana,electrica}/` (véase `catalog_scan`).

Los cascos se cargan de forma idempotente desde `frontend/public/images/catalog/cascos/cascoN.*`
al ejecutar el seed (aunque la base ya esté sembrada), vía `ensure_cascos_category_and_products`.

Ejecutar desde la carpeta `backend`:  python -m scripts.seed

Para regenerar el manifiesto del frontend tras añadir/quitar PNG:
  python tools/generate_catalog_manifest.py

Nota: si la base ya tiene categorías, no se vuelve a sembrar el bloque inicial de bicis.
Borra datos o tablas y vuelve a migrar + seed para regenerar todo.
"""

import re
from decimal import Decimal

from app.database import SessionLocal
from app.models import Category, Product, User
from app.core.security import hash_password

from scripts.catalog_scan import scan_catalog_png_indices, scan_cascos_filenames


def catalog_path(folder: str, index: int) -> str:
    return f"/images/catalog/{folder}/{folder}-{index:02d}.png"


FOLDER_BY_CATEGORY = {
    "ciudad": "ciudad",
    "montana": "montana",
    "electrica": "electrica",
}

# Metadatos por índice 1..7 (ciudad-01.png … ciudad-07.png en public/images/catalog/ciudad/)
CIUDAD: list[tuple[str, str, str, Decimal, int]] = [
    (
        "01",
        "Bicicleta Urbana Vintage Celeste",
        "Estilo holandés con cuadro abierto celeste mate, manillar alto y sillín amplio; portaequipajes trasero y guardabarros crema. Ideal para ir cómoda y erguida al trabajo o al parque.",
        Decimal("689.00"),
        10,
    ),
    (
        "02",
        "Topmega Classic Urbana",
        "Diseño clásico minimalista en tono oscuro, acabados cromados y terminaciones tipo cuero marrón; ruedas finas y línea limpia para el asfalto diario.",
        Decimal("420.00"),
        9,
    ),
    (
        "03",
        "Specialized Tarmac SL7 Force eTap AXS",
        "Ruta de alto rendimiento: cuadro carbono, SRAM Force eTap AXS 12v, ruedas Roval Rapide y frenos de disco. Para quien quiere velocidad y eficiencia también en la ciudad.",
        Decimal("8500.00"),
        4,
    ),
    (
        "04",
        "Cruiser Custom Bicolor Schwalbe",
        "Cuadro tipo cruiser con degradado cian–negro, manillar alto y neumáticos Schwalbe Fat Frank en crema; una sola velocidad, look retro y rodada suave en calle.",
        Decimal("1199.00"),
        8,
    ),
    (
        "05",
        "BMC Road Performance Urban Edition",
        "Carretera premium en negro mate: transmisión electrónica Shimano Ultegra Di2, frenos hidráulicos y neumáticos Vittoria; agilidad y precisión para desplazamientos rápidos.",
        Decimal("5200.00"),
        5,
    ),
    (
        "06",
        "Urban Neon Fixie",
        "Fixie minimalista con cuadro amarillo neón y componentes negros; ligera, de bajo mantenimiento y muy visible en tráfico urbano.",
        Decimal("449.00"),
        10,
    ),
    (
        "07",
        'Bicicleta Urbana Híbrida "City Black"',
        "Cuadro negro mate con horquilla de suspensión delantera, cambios multispeed y neumáticos finos Kenda; posición cómoda para calles, bordillos y trayectos mixtos.",
        Decimal("459.00"),
        8,
    ),
]

MONTANA: list[tuple[str, str, str, Decimal, int]] = [
    ("01", "MTB Trail 01", "Doble suspensión orientada a senderos técnicos y bajadas controladas.", Decimal("1299.00"), 6),
    ("02", "MTB Trail 02", "Geometría estable; ruedas y frenos pensados para terreno variado.", Decimal("1349.00"), 6),
    ("03", "MTB Trail 03", "Enduro ligero: sube eficiente y baja con aplomo.", Decimal("1399.00"), 5),
    ("04", "MTB Trail 04", "Cuadro resistente para uso frecuente en montaña.", Decimal("1449.00"), 5),
    ("05", "MTB Trail 05", "Todo terreno: tracción y confort en pistas largas.", Decimal("1199.00"), 7),
    ("06", "MTB Trail 06", "Ritmo de cross-country; eficiente en subidas y pedaleo constante.", Decimal("1249.00"), 6),
    ("07", "MTB Trail 07", "Montaña polivalente; buen punto de partida para mejoras.", Decimal("1099.00"), 8),
    ("08", "MTB Trail 08", "Configuración equilibrada para rutas mixtas y senderos suaves.", Decimal("1149.00"), 7),
]

ELECTRICA: list[tuple[str, str, str, Decimal, int]] = [
    ("01", "E-bike Volt 01", "Asistencia al pedaleo y autonomía pensada para ciudad y periurbano.", Decimal("2299.00"), 5),
    ("02", "E-bike Volt 02", "Motor integrado y batería de uso diario; cómoda en pendientes.", Decimal("2399.00"), 5),
    ("03", "E-bike Volt 03", "Estilo trekking eléctrico; carga y versatilidad en rutas largas.", Decimal("2499.00"), 4),
    ("04", "E-bike Volt 04", "E-bike urbana con buen equilibrio peso–potencia.", Decimal("2599.00"), 4),
    ("05", "E-bike Volt 05", "Asistencia suave para trayectos mixtos; fácil de maniobrar.", Decimal("2199.00"), 6),
    ("06", "E-bike Volt 06", "Uso polivalente: asfalto y caminos compactados con motor eficiente.", Decimal("2349.00"), 5),
    ("07", "E-bike Volt 07", "Gran autonomía relativa y posición cómoda para distancias medias.", Decimal("2699.00"), 3),
    ("08", "E-bike Volt 08", "E-bike robusta para terreno abierto y ritmo deportivo.", Decimal("2799.00"), 3),
]


def _meta_for_index(lines: list[tuple[str, str, str, Decimal, int]], file_idx: int) -> tuple[str, str, str, Decimal, int]:
    if 1 <= file_idx <= len(lines):
        return lines[file_idx - 1]
    suf = f"{file_idx:02d}"
    return (
        suf,
        f"Modelo {suf}",
        f"Bicicleta catálogo índice {file_idx}; imagen local en public/images/catalog.",
        Decimal("899.00") + file_idx * 10,
        5,
    )


def _slug(cat: str, num_suffix: str) -> str:
    if cat == "ciudad":
        return f"ciudad-linea-{num_suffix}"
    if cat == "montana":
        return f"mtb-trail-{num_suffix}"
    return f"ebike-volt-{num_suffix}"


def casco_public_url(filename: str) -> str:
    return f"/images/catalog/cascos/{filename}"


# Metadatos por índice de archivo casco1…cascoN (si hay más archivos, usa `_cascos_meta_for_index`).
CASCOS_LINES: list[tuple[str, str, Decimal, int]] = [
    (
        "Casco Urbano Air Vent",
        "Ventilación amplia y poco peso; pensado para trayectos urbanos y e-bike diaria.",
        Decimal("79.00"),
        14,
    ),
    (
        "Casco Sport Compact",
        "Perfil ceñido y buena refrigeración; cierre micrométrico y acolchado desmontable.",
        Decimal("89.00"),
        12,
    ),
    (
        "Casco Trail Shield Mips",
        "Cobertura extendida en nuca y laterales; ideal para sendero y uso mixto.",
        Decimal("129.00"),
        8,
    ),
    (
        "Casco City LED Integrado",
        "Visera corta y soporte para luz trasera; mayor visibilidad en tráfico.",
        Decimal("95.00"),
        10,
    ),
    (
        "Casco Enduro Vent Pro",
        "Mayor superficie de ventilación y correas anchas; comodidad en rutas largas.",
        Decimal("109.00"),
        9,
    ),
    (
        "Casco Junior Fit",
        "Ajuste progresivo para adolescentes y tallas intermedias; mismo estándar de seguridad.",
        Decimal("59.00"),
        15,
    ),
    (
        "Casco Aero Lite",
        "Forma compacta con canales de aire profundos; equilibrio entre aerodinámica y confort.",
        Decimal("119.00"),
        7,
    ),
    (
        "Casco Trekking Allround",
        "Protección polivalente para carretera compactada y calles con baches.",
        Decimal("99.00"),
        11,
    ),
]


def _casco_file_index(filename: str) -> int:
    m = re.search(r"casco(\d+)", filename, re.I)
    return int(m.group(1)) if m else 0


def _cascos_meta_for_index(file_idx: int) -> tuple[str, str, Decimal, int]:
    if 1 <= file_idx <= len(CASCOS_LINES):
        return CASCOS_LINES[file_idx - 1]
    suf = f"{file_idx:02d}"
    return (
        f"Casco línea {suf}",
        "Protección homologada para ciclismo; encaje regulable y acolchado lavable.",
        Decimal("69.00") + file_idx,
        10,
    )


def ensure_cascos_category_and_products(db) -> int:
    """Crea categoría `cascos` y productos por archivo local. Idempotente. Retorna cuántos productos nuevos se añadieron."""
    filenames = scan_cascos_filenames()
    if not filenames:
        return 0

    cat = db.query(Category).filter(Category.slug == "cascos").first()
    if not cat:
        cat = Category(
            slug="cascos",
            name="Cascos",
            description="Protección para ciudad, montaña y e-bike.",
        )
        db.add(cat)
        db.flush()

    added = 0
    for fn in filenames:
        idx = _casco_file_index(fn)
        if idx < 1:
            continue
        slug = f"casco-linea-{idx:02d}"
        if db.query(Product).filter(Product.slug == slug).first():
            continue
        name, desc, price, stock = _cascos_meta_for_index(idx)
        db.add(
            Product(
                category_id=cat.id,
                name=name,
                slug=slug,
                description=desc,
                price=price,
                image_url=casco_public_url(fn),
                stock=stock,
                is_active=True,
            )
        )
        added += 1
    return added


def build_products_from_scan() -> list[tuple[str, str, str, str, Decimal, int, int]]:
    scan = scan_catalog_png_indices()
    rows: list[tuple[str, str, str, str, Decimal, int, int]] = []
    tables = {"ciudad": CIUDAD, "montana": MONTANA, "electrica": ELECTRICA}
    for folder, cat_slug in FOLDER_BY_CATEGORY.items():
        indices = scan.get(folder) or []
        lines = tables[cat_slug]
        for idx in indices:
            num_str, name, desc, price, stock = _meta_for_index(lines, idx)
            slug = _slug(cat_slug, num_str)
            rows.append((cat_slug, slug, name, desc, price, stock, idx))
    return rows


# Email con dominio válido para EmailStr / email-validator (.test es reserved y falla en login).
DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demo1234"
LEGACY_DEMO_EMAIL = "demo@ebiketucson.test"


def ensure_demo_user(db) -> None:
    """Crea o actualiza el usuario demo (idempotente; también migra el email legacy)."""
    hashed = hash_password(DEMO_PASSWORD)
    user = (
        db.query(User)
        .filter(User.email.in_([DEMO_EMAIL, LEGACY_DEMO_EMAIL]))
        .first()
    )
    if user:
        user.email = DEMO_EMAIL
        user.hashed_password = hashed
        user.full_name = user.full_name or "Demo Shopper"
        user.is_active = True
        print(f"Demo user ready: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        return

    db.add(
        User(
            email=DEMO_EMAIL,
            hashed_password=hashed,
            full_name="Demo Shopper",
            is_active=True,
        )
    )
    print(f"Demo user created: {DEMO_EMAIL} / {DEMO_PASSWORD}")


def run() -> None:
    db = SessionLocal()
    try:
        if not db.query(Category).first():
            cats = [
                Category(slug="montana", name="Montaña", description="Bicicletas todo terreno."),
                Category(slug="ciudad", name="Ciudad", description="Urbanas y commuting."),
                Category(slug="electrica", name="Eléctricas", description="E-bikes y asistencia al pedaleo."),
            ]
            db.add_all(cats)
            db.flush()

            slug_to_id = {c.slug: c.id for c in cats}

            products_data = build_products_from_scan()
            for cat_slug, slug, name, desc, price, stock, idx in products_data:
                folder = FOLDER_BY_CATEGORY[cat_slug]
                db.add(
                    Product(
                        category_id=slug_to_id[cat_slug],
                        name=name,
                        slug=slug,
                        description=desc,
                        price=price,
                        image_url=catalog_path(folder, idx),
                        stock=stock,
                        is_active=True,
                    )
                )

            db.commit()
            n = len(products_data)
            print(f"Seed completed: categories, {n} products")
        else:
            print("Database already seeded, skipping initial bike catalog.")

        ensure_demo_user(db)
        n_cascos = ensure_cascos_category_and_products(db)
        db.commit()
        if n_cascos:
            print(f"Cascos: se añadieron {n_cascos} producto(s) nuevos.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
