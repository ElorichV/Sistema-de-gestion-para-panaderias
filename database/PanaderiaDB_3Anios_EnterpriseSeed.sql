/* =================================================================================
   PANIFICADORA TANAJARA — ENTERPRISE 3-YEAR RELATIONAL DATASET (2024 - 2026)
   Motor: Microsoft SQL Server (2019 / 2022 / 2025)
   Base de Datos: PanaderiaDB (15 Tablas en 3FN + Índices Cubrientes + ~60,000 Filas)
   ================================================================================= */

SET NOCOUNT ON;
SET XACT_ABORT ON;

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'PanaderiaDB')
BEGIN
    ALTER DATABASE PanaderiaDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE PanaderiaDB;
END
GO

CREATE DATABASE PanaderiaDB;
GO

USE PanaderiaDB;
GO

-- =================================================================================
-- 1. CATÁLOGOS LOOKUP (3FN)
-- =================================================================================
CREATE TABLE Puestos (
    PuestoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL
);

CREATE TABLE TipoCliente (
    TipoClienteID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL
);

CREATE TABLE TipoProducto (
    TipoProductoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL
);

CREATE TABLE UnidadMedida (
    UnidadMedidaID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(50) NOT NULL,
    Abreviatura VARCHAR(10) NOT NULL
);

CREATE TABLE TipoImpuesto (
    TipoImpuestoID INT PRIMARY KEY IDENTITY(1,1),
    Descripcion VARCHAR(100) NOT NULL,
    Porcentaje DECIMAL(5, 4) NOT NULL
);

-- =================================================================================
-- 2. ENTIDADES MAESTRAS
-- =================================================================================
CREATE TABLE Sucursales (
    SucursalID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(150) NOT NULL,
    Direccion VARCHAR(255) NULL
);

CREATE TABLE Empleados (
    EmpleadoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    PuestoID INT NOT NULL,
    SucursalID INT NOT NULL,
    FechaContratacion DATE NOT NULL,
    CONSTRAINT FK_Empleado_Puesto FOREIGN KEY (PuestoID) REFERENCES Puestos(PuestoID),
    CONSTRAINT FK_Empleado_Sucursal FOREIGN KEY (SucursalID) REFERENCES Sucursales(SucursalID)
);

CREATE TABLE Clientes (
    ClienteID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(150) NOT NULL,
    RFC VARCHAR(13) NULL,
    Email VARCHAR(100) NULL,
    TipoClienteID INT NOT NULL,
    CONSTRAINT UQ_Cliente_Email UNIQUE(Email),
    CONSTRAINT FK_Cliente_Tipo FOREIGN KEY (TipoClienteID) REFERENCES TipoCliente(TipoClienteID)
);

CREATE TABLE Proveedores (
    ProveedorID INT PRIMARY KEY IDENTITY(1,1),
    NombreFiscal VARCHAR(255) NOT NULL,
    RFC VARCHAR(13) NOT NULL,
    NombreContacto VARCHAR(150) NULL,
    CONSTRAINT UQ_Proveedor_RFC UNIQUE(RFC)
);

CREATE TABLE Productos (
    ProductoID INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(150) NOT NULL,
    Descripcion TEXT NULL,
    TipoProductoID INT NOT NULL,
    UnidadMedidaID INT NOT NULL,
    PrecioVenta DECIMAL(10, 2) NOT NULL CONSTRAINT DF_Producto_PrecioVenta DEFAULT 0.00,
    CostoPromedio DECIMAL(10, 2) NOT NULL CONSTRAINT DF_Producto_CostoPromedio DEFAULT 0.00,
    EsVendible BIT NOT NULL CONSTRAINT DF_Producto_EsVendible DEFAULT 1,
    EsInsumo BIT NOT NULL CONSTRAINT DF_Producto_EsInsumo DEFAULT 0,
    CONSTRAINT FK_Producto_Tipo FOREIGN KEY (TipoProductoID) REFERENCES TipoProducto(TipoProductoID),
    CONSTRAINT FK_Producto_Unidad FOREIGN KEY (UnidadMedidaID) REFERENCES UnidadMedida(UnidadMedidaID)
);

-- =================================================================================
-- 3. NÚCLEO TRANSACCIONAL ACID
-- =================================================================================
CREATE TABLE Ventas (
    VentaID INT PRIMARY KEY IDENTITY(1,1),
    SucursalID INT NOT NULL,
    EmpleadoID INT NOT NULL,
    ClienteID INT NULL,
    TipoImpuestoID INT NOT NULL,
    FechaHora DATETIME NOT NULL CONSTRAINT DF_Venta_FechaHora DEFAULT CURRENT_TIMESTAMP,
    Subtotal DECIMAL(12, 2) NOT NULL,
    TotalImpuestos DECIMAL(12, 2) NOT NULL,
    Total DECIMAL(12, 2) NOT NULL,
    Estatus VARCHAR(20) NOT NULL CONSTRAINT DF_Venta_Estatus DEFAULT 'Completada',
    CONSTRAINT FK_Venta_Sucursal FOREIGN KEY (SucursalID) REFERENCES Sucursales(SucursalID),
    CONSTRAINT FK_Venta_Empleado FOREIGN KEY (EmpleadoID) REFERENCES Empleados(EmpleadoID),
    CONSTRAINT FK_Venta_Cliente FOREIGN KEY (ClienteID) REFERENCES Clientes(ClienteID),
    CONSTRAINT FK_Venta_Impuesto FOREIGN KEY (TipoImpuestoID) REFERENCES TipoImpuesto(TipoImpuestoID)
);

CREATE TABLE VentaDetalle (
    VentaDetalleID INT PRIMARY KEY IDENTITY(1,1),
    VentaID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad DECIMAL(10, 3) NOT NULL,
    PrecioUnitario DECIMAL(10, 2) NOT NULL,
    Importe AS (Cantidad * PrecioUnitario),
    CONSTRAINT FK_VentaDetalle_Venta FOREIGN KEY (VentaID) REFERENCES Ventas(VentaID),
    CONSTRAINT FK_VentaDetalle_Producto FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

CREATE TABLE Compras (
    CompraID INT PRIMARY KEY IDENTITY(1,1),
    ProveedorID INT NOT NULL,
    SucursalID INT NOT NULL,
    EmpleadoID INT NOT NULL,
    FechaRecepcion DATE NOT NULL,
    Total DECIMAL(12, 2) NOT NULL,
    CONSTRAINT FK_Compra_Proveedor FOREIGN KEY (ProveedorID) REFERENCES Proveedores(ProveedorID),
    CONSTRAINT FK_Compra_Sucursal FOREIGN KEY (SucursalID) REFERENCES Sucursales(SucursalID),
    CONSTRAINT FK_Compra_Empleado FOREIGN KEY (EmpleadoID) REFERENCES Empleados(EmpleadoID)
);

CREATE TABLE CompraDetalle (
    CompraDetalleID INT PRIMARY KEY IDENTITY(1,1),
    CompraID INT NOT NULL,
    ProductoID INT NOT NULL,
    Cantidad DECIMAL(10, 3) NOT NULL,
    CostoUnitario DECIMAL(10, 2) NOT NULL,
    CONSTRAINT FK_CompraDetalle_Compra FOREIGN KEY (CompraID) REFERENCES Compras(CompraID),
    CONSTRAINT FK_CompraDetalle_Producto FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID)
);

CREATE TABLE Inventario (
    InventarioID INT PRIMARY KEY IDENTITY(1,1),
    SucursalID INT NOT NULL,
    ProductoID INT NOT NULL,
    CantidadStock DECIMAL(12, 3) NOT NULL CONSTRAINT DF_Inventario_Stock DEFAULT 0.00,
    CONSTRAINT FK_Inventario_Sucursal FOREIGN KEY (SucursalID) REFERENCES Sucursales(SucursalID),
    CONSTRAINT FK_Inventario_Producto FOREIGN KEY (ProductoID) REFERENCES Productos(ProductoID),
    CONSTRAINT UQ_Inventario_Producto_Sucursal UNIQUE(SucursalID, ProductoID)
);
GO

-- =================================================================================
-- 4. POBLADO DE CATÁLOGOS Y MAESTROS
-- =================================================================================
INSERT INTO Sucursales (Nombre, Direccion) VALUES
('Matriz Centro Historico', 'Calle 5 de Mayo #123, Centro Historico'),
('Tahona Norte Vallarta', 'Av. Vallarta #4500, Jardines del Bosque'),
('Obrador Sur Perisur', 'Blvd. Perisur #890, Insurgentes Sur'),
('Horno Este Independencia', 'Calz. Independencia #202, Zona Oriente'),
('Boutique Oeste Aviacion', 'Av. Aviacion #999, Valle Real');

INSERT INTO Puestos (Nombre) VALUES
('Maestro Tahonero Director'), ('Gerente de Sucursal'), ('Cajero Principal POS'), ('Cajero Vespertino'),
('Jefe de Masa Madre'), ('Oficial de Horno de Piedra'), ('Maestro Repostero'), ('Barista Especialidad'),
('Coordinador de Abastecimiento'), ('Logistica de Reparto'), ('Sanidad Alimentaria'), ('Contralor Fiscal'),
('Encargado de Almacen'), ('Laminador de Hojaldre'), ('Atencion Convenios B2B');

INSERT INTO TipoCliente (Nombre) VALUES
('Publico Mostrador'), ('Convenio Restaurante'), ('Cadena Hotelera'), ('Colaborador Interno'),
('Suscripcion Matutina'), ('Institucion Educativa'), ('Sector Salud'), ('Cliente Ouroboros VIP');

INSERT INTO TipoProducto (Nombre) VALUES
('Pan Dulce Tradicional'), ('Masa Madre & Salado'), ('Alta Reposteria'), ('Barra Espresso Caliente'),
('Bebidas Frias & Infusiones'), ('Lacteos Artesanales'), ('Despensa Gourmet'),
('Insumos Harinas Fuerza'), ('Insumos Mantequillas & Grasas'), ('Insumos Fermentos & Aromas');

INSERT INTO UnidadMedida (Nombre, Abreviatura) VALUES
('Pieza', 'pz'), ('Kilogramo', 'kg'), ('Litro', 'lt'), ('Paquete', 'pq'),
('Caja', 'cj'), ('Bulto 44kg', 'bto'), ('Gramo', 'gr'), ('Rebanada', 'reb');

INSERT INTO TipoImpuesto (Descripcion, Porcentaje) VALUES
('IVA General 16%', 0.1600),
('Tasa Cero Panificacion Basica 0%', 0.0000),
('IEPS Alta Densidad Calorica 8%', 0.0800);

INSERT INTO Proveedores (NombreFiscal, RFC, NombreContacto) VALUES
('Molinos Harineros La Espiga Dorada SA', 'MHE900115AA1', 'Ing. Mateo Villalobos'),
('Cuenca Lechera Altos de Jalisco SPR', 'CLA880220BB2', 'Lic. Sofia Mondragon'),
('Finca Cafetalera Soconusco Altura SA', 'FCS770310CC3', 'Don Emiliano Corzo'),
('Ingenio Azucarero del Papaloapan SA', 'IAP660405DD4', 'Ing. Renata Castellanos'),
('Empaques Kraft Biodegradables MX SA', 'EKB950512EE5', 'Arq. Bruno Santamaria'),
('Granjas Avicolas San Juan Libre Pastoreo', 'GAS840618FF6', 'MVZ. Camilo Elizondo'),
('Orquideas y Vainilla de Papantla SPR', 'OVP930722GG7', 'Mtra. Citlalli Tovar'),
('Cacaoteros Chontalpa Tabasco SA', 'CCT820830HH8', 'Ing. Jonas Pedrero'),
('Mantequillas Fermentadas Normandia MX', 'MFN910914II9', 'Chef Luciana Beltran'),
('Levaduras y Cultivos Lacticos BioFerment', 'LCL871025JJ0', 'QFB. Dario Alcantara'),
('Frutos Rojos de Jocotepec SPR', 'FRJ991111KK1', 'Ing. Valeria Madrigal'),
('Almendras y Nueces del Conchos SA', 'ANC881219LL2', 'Lic. Hector Tarango'),
('Mieles Organicas de la Peninsula SA', 'MOP940108MM3', 'Biol. Ixchel Pech'),
('Gas Natural Industrial de Occidente SA', 'GNI790217NN4', 'Ing. Rogelio Saucedo'),
('Hornos Refractarios de Piedra Volcanica', 'HRP850328OO5', 'Ing. Octavio Renteria'),
('Especias y Canelas de Ceilan Import SA', 'ECC920409PP6', 'Lic. Nadia Samperio'),
('Queserias Artesanales de Queretaro SA', 'QAQ960521QQ7', 'Mtro. Patricio Urquiza'),
('Aceites de Oliva Valle de Guadalupe SA', 'AOV900630RR8', 'Enol. Marina Cota'),
('Salinas de Cuyutlan Flor de Sal SPR', 'SCF830712SS9', 'Don Aurelio Ceballos'),
('maquinaria Amasadoras Espiral EuroPan SA', 'MAE890824TT0', 'Ing. Klaus Lindemann');

INSERT INTO Empleados (Nombre, Apellido, PuestoID, SucursalID, FechaContratacion) VALUES
('Angel', 'Guerrero', 1, 1, '2021-01-15'),
('Axel', 'Linares', 2, 1, '2021-03-20'),
('Elena', 'Santibanez', 5, 1, '2022-02-10'),
('Roberto', 'Mondragon', 3, 1, '2022-05-10'),
('Lucia', 'covarrubias', 7, 1, '2022-08-01'),
('julian', 'Tellez', 8, 1, '2023-01-12'),
('Marcos', 'Zavaleta', 13, 1, '2023-04-18'),
('Fernanda', 'Orozco', 2, 2, '2021-06-15'),
('Diego', 'Paniagua', 5, 2, '2022-01-20'),
('Camila', 'Bustamante', 3, 2, '2022-09-05'),
('Sebastian', 'Lira', 7, 2, '2023-02-14'),
('Valeria', 'Rios', 8, 2, '2023-07-01'),
('Andres', 'Mendieta', 14, 2, '2023-10-10'),
('Gabriela', 'Penaloza', 2, 3, '2021-11-01'),
('Hector', 'arbeu', 6, 3, '2022-03-15'),
('Natalia', 'Escobar', 3, 3, '2022-10-22'),
('Emilio', 'Salgado', 7, 3, '2023-03-08'),
('Paula', 'Cardenas', 4, 3, '2023-11-19'),
('Rodrigo', 'Almazan', 2, 4, '2022-04-01'),
('Daniela', 'Villasenor', 6, 4, '2022-07-14'),
('Mauricio', 'Correa', 3, 4, '2023-01-25'),
('Ximena', 'Peralta', 8, 4, '2023-06-12'),
('Oscar', 'Becerra', 13, 4, '2023-09-30'),
('Mariana', 'Solorzano', 2, 5, '2022-08-15'),
('Alejandro', 'Trujillo', 5, 5, '2022-12-01'),
('Renata', 'Aguayo', 3, 5, '2023-04-03'),
('Tomas', 'Echeverria', 14, 5, '2023-08-21'),
('claudia', 'Beristain', 15, 1, '2023-05-15'),
('Esteban', 'Jauregui', 9, 1, '2022-02-28'),
('Sofia', 'Arredondo', 12, 1, '2021-09-01');

-- 60 Clientes (Cliente 1 = Mostrador General + 59 clientes B2B / VIP / Convenios)
INSERT INTO Clientes (Nombre, RFC, Email, TipoClienteID) VALUES
('Mostrador General', 'XAXX010101000', 'mostrador@tanajara.mx', 1),
('Hotel Boutique Casa de Piedra', 'HBC180210AA1', 'compras@casadepiedra.mx', 3),
('Restaurante El Bajio Imperial', 'RBI150622BB2', 'chef@bajioimperial.com', 2),
('Cafeteria La Brujula Tostadores', 'CBT190914CC3', 'barra@labrujula.cafe', 2),
('Gran Hotel Alameda Historico', 'GHA120105DD4', 'abastecimiento@hotelalameda.mx', 3),
('Colegio Montesori del Bosque', 'CMB100830EE5', 'comedor@montesoribosque.edu.mx', 6),
('Hospital San Javier Especialidades', 'HSJ080412FF6', 'nutricion@sanjavier.org.mx', 7),
('Bistro Frances Le Levain', 'BFL210319GG7', 'cuisine@lelevain.mx', 2),
('Club Ejecutivo Reforma', 'CER141128HH8', 'eventos@clubreforma.mx', 8),
('Universidad Autonoma Metropolitana Sur', 'UAM050701II9', 'cafeteria@uamsur.edu.mx', 6);

;WITH ExtraClientes AS (
    SELECT TOP 50
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects
)
INSERT INTO Clientes (Nombre, RFC, Email, TipoClienteID)
SELECT
    CONCAT('Cliente Selecto Tanajara #', FORMAT(n, '00'), ' - ',
           CHOOSE((n % 5) + 1, 'Terraza', 'Comedor', 'Residencia', 'Estudio', 'Catering')),
    CONCAT('CST', FORMAT(10 + n, '00'), '0515K', FORMAT(n, '00')),
    CONCAT('cliente.selecto', n, '@redtanajara.mx'),
    ((n % 8) + 1)
FROM ExtraClientes;

-- 48 Productos e Insumos (IDs 1..36 Vendibles, IDs 37..48 Insumos puros de almacén)
INSERT INTO Productos (Nombre, Descripcion, TipoProductoID, UnidadMedidaID, PrecioVenta, CostoPromedio, EsVendible, EsInsumo) VALUES
-- Pan Dulce Tradicional (Tipo 1)
('Concha Vainilla de Papantla', 'Brioche fermentado 12h con costra crujiente de vainilla natural en vaina', 1, 1, 18.00, 6.20, 1, 0),
('Concha Cacao Real Tabasqueno', 'Masa enriquecida con mantequilla y costra de cacao tostado al metate', 1, 1, 18.50, 6.60, 1, 0),
('Oreja Hojaldrada Caramelizada', 'Laminado de 27 pliegues con mantequilla de Normandia y azucar moscabado', 1, 1, 16.00, 5.10, 1, 0),
('Garibaldi de Chabacano Artesanal', 'Bizcocho humedo de mantequilla cubierto con jalea de chabacano y gragea blanca', 1, 1, 20.00, 7.20, 1, 0),
('Rol de Canela Ceilan & Nuez', 'Espiral tierna con canela recien molida, nuez pecana y glaseado de queso crema', 1, 1, 32.00, 11.40, 1, 0),
('Cuernito Danés de Mantequilla', 'Media luna suave con barniz de huevo de granja y toque de miel de azahar', 1, 1, 19.00, 6.80, 1, 0),
('Dona Ganache Chocolate 70%', 'Fermentacion lenta frita en limpio con cobertura brillante de cacao amargo', 1, 1, 24.00, 8.50, 1, 0),
('Ojo de Buey Tradicional', 'Centro abizcochado rodeado de anillo crujiente de hojaldre dorado', 1, 1, 17.00, 5.80, 1, 0),
('Pan de Muerto Azahar & Naranja', 'Receta ceremonial con ralladura de naranja agria, agua de azahar y mantequilla', 1, 1, 38.00, 13.50, 1, 0),
('Rosca de Reyes Artesanal Familiar', 'Rosca ovalada para 10 personas con ate de membrillo, higo cristalizado y costra de almendra', 1, 1, 420.00, 155.00, 1, 0),
-- Masa Madre & Salado (Tipo 2)
('Bolillo de Horno de Piedra', 'Corteza crepitante al vapor y miga algodonosa horneada sobre piso volcanico', 2, 1, 7.50, 2.20, 1, 0),
('Telera Tradicional Mexicana', 'Tres hendiduras clasicas, miga firme ideal para loncheria gourmet', 2, 1, 8.50, 2.50, 1, 0),
('Baguette Rustica Masa Madre 24h', 'Fermentacion en frio con harina fuerza W320, alveolo abierto y corteza dorada', 2, 1, 34.00, 10.80, 1, 0),
('Hogaza Campesina Centeno & Semillas', 'Pan redondo de 850g con masa madre centeno, linaza, girasol y ajonjoli tostado', 2, 1, 78.00, 26.00, 1, 0),
('Ciabatta de Aceite de Oliva & Romero', 'Alta hidratacion 82% con aceite extra virgen del Valle de Guadalupe', 2, 1, 26.00, 8.40, 1, 0),
('Croissant Frances Puro Isigny', 'Hojaldre alveolado en panal con mantequilla cultivada, crujiente y etereo', 2, 1, 36.00, 12.90, 1, 0),
('Focaccia Tomate Rostizado & Flor de Sal', 'Porcion cuadrada esponjosa con jitomate cherry confitado y sal de Cuyutlan', 2, 1, 42.00, 14.50, 1, 0),
('Birote Salado Tapatio', 'Fermento acido tradicional de corteza gruesa y dorada', 2, 1, 14.00, 4.30, 1, 0),
-- Alta Reposteria (Tipo 3)
('Pastel Tres Leches Imperial 2kg', 'Bizcocho genovesa banado en infusion de tres leches con vainilla en vaina y frutos rojos', 3, 1, 440.00, 168.00, 1, 0),
('Rebanada Tres Leches Imperial', 'Porcion individual coronada con crema batida fresca y fresa de Jocotepec', 3, 8, 62.00, 21.50, 1, 0),
('Tarta Bourdaloue Pera & Almendra', 'Base sable breton rellena de crema frangipane de almendra y pera escalfada', 3, 8, 68.00, 24.00, 1, 0),
('Cheesecake Vasco Tostado', 'Interior cremoso y superficie caramelizada a alta temperatura estilo San Sebastian', 3, 8, 72.00, 26.50, 1, 0),
('Milhojas de Vainilla & Caramelo', 'Tres capas de hojaldre invertido caramelizado con crema diplomata de vainilla', 3, 1, 65.00, 22.80, 1, 0),
('Pain au Chocolat Doble Barra', 'Laminado frances relleno con dos barras de chocolate semiamargo 64%', 3, 1, 40.00, 14.20, 1, 0),
('Eclair Praline de Avellana', 'Pasta choux rellena de muselina de avellana tostada y glaseado espejo', 3, 1, 58.00, 20.40, 1, 0),
('Kouign-Amann Breton', 'Corona bretona de masa hojaldrada caramelizada en mantequilla salada', 3, 1, 44.00, 15.10, 1, 0),
-- Barra Espresso Caliente (Tipo 4)
('Cafe de Olla Especiado 12oz', 'Grano de altura Soconusco infusionado con piloncillo, canela, clavo y naranja', 4, 1, 36.00, 8.20, 1, 0),
('Americano Doble Extraccion 12oz', 'Espresso doble de tueste medio con notas a cacao y nuez sobre agua filtrada', 4, 1, 38.00, 8.90, 1, 0),
('Cappuccino Texturizado 12oz', 'Balance exacto de espresso, leche vaporizada sedosa y microespuma brillante', 4, 1, 48.00, 12.40, 1, 0),
('Chocolate Caliente de Metate 12oz', 'Tablilla artesanal batida con molinillo en leche entera caliente', 4, 1, 52.00, 15.80, 1, 0),
('Latte Vainilla Papantla 16oz', 'Espresso suave con jarabe natural hecho en casa de vainilla mexicana', 4, 1, 56.00, 14.90, 1, 0),
-- Bebidas Frias & Lacteos / Gourmet (Tipos 5, 6, 7)
('Cold Brew Tonico Naranja 16oz', 'Maceracion en frio por 18 horas servida sobre agua tonica y piel de naranja', 5, 1, 58.00, 15.20, 1, 0),
('Frappe Moka Cacao Real 16oz', 'Bebida helada cremosa con espresso, ganache de chocolate y crema batida', 5, 1, 64.00, 17.50, 1, 0),
('Jugo Naranja Recien Exprimido 500ml', 'Naranja Valencia prensada al momento sin azucar anadida', 5, 1, 35.00, 11.80, 1, 0),
('Leche Entera Pasteurizada Rancho 1L', 'Botella de leche fresca entera de libre pastoreo', 6, 3, 32.00, 23.50, 1, 1),
('Mermelada Artesanal Frutos Rojos 250g', 'Conserva de fresa, zarzamora y frambuesa cocinada en cazo de cobre', 7, 1, 85.00, 34.00, 1, 0),
-- Insumos No Vendibles en Mostrador (IDs 37..48, EsVendible = 0, EsInsumo = 1)
('Harina Trigo Fuerza W320 (Bulto 44kg)', 'Harina panadera alto contenido proteico 13.5% para masa madre y laminados', 8, 6, 0.00, 580.00, 0, 1),
('Harina Centeno Integral (Saco 25kg)', 'Molienda en piedra para hogazas rusticas y refresco de levain', 8, 6, 0.00, 490.00, 0, 1),
('Azucar Refinada Caña (Bulto 50kg)', 'Cristal fino para reposteria, merengues y masas dulces', 8, 6, 0.00, 840.00, 0, 1),
('Mantequilla Fermentada 84% Grasa (Caja 10kg)', 'Placas de mantequilla seca especial para tourage de croissant y milhojas', 9, 5, 0.00, 1850.00, 0, 1),
('Huevo Blanco Granja Libre (Caja 360pz)', 'Huevo fresco seleccionado de yema intensa para bizcocheria', 9, 5, 0.00, 920.00, 0, 1),
('Crema para Batir 36% Lactea (Caja 12L)', 'Nata pura de vaca sin grasas vegetales para tres leches y diplomata', 6, 5, 0.00, 1080.00, 0, 1),
('Chocolate Cobertura 70% Cacao (Saco 10kg)', 'Marqueta en callets de cacao tabasqueno para ganache y horneado', 10, 5, 0.00, 2150.00, 0, 1),
('Vainilla Natural en Vaina Papantla (Paq 250g)', 'Vainas gourmet humedas de primera cosecha', 10, 4, 0.00, 1450.00, 0, 1),
('Cafe en Grano Soconusco Tueste Medio (Saco 15kg)', 'Especialidad 86 puntos SCA lavado de altura', 10, 6, 0.00, 3450.00, 0, 1),
('Levadura Fresca Panadera (Caja 10kg)', 'Bloques activos Saccharomyces cerevisiae para fermentacion controlada', 10, 5, 0.00, 520.00, 0, 1),
('Almendra Fileteada Californiana (Caja 10kg)', 'Laminas finas para tartas Bourdaloue y roscas', 10, 5, 0.00, 1980.00, 0, 1),
('Cajas y Empaques Kraft Grado Alimenticio (Paq 500pz)', 'Empaque ecologico para pasteleria y pan recien horneado', 7, 4, 0.00, 1320.00, 0, 1);

-- =================================================================================
-- 5. INVENTARIO MULTI-SUCURSAL (240 Registros = 5 Sucursales x 48 SKUs)
--    Incluye casos deliberados de Stock Crítico y Agotado en Sucursal 1 para demos ACID
-- =================================================================================
INSERT INTO Inventario (SucursalID, ProductoID, CantidadStock)
SELECT
    s.SucursalID,
    p.ProductoID,
    CASE
        -- Casos controlados en Matriz Centro (Sucursal 1) para probar Rollback y Alertas en vivo:
        WHEN s.SucursalID = 1 AND p.ProductoID = 22 THEN 0.000   -- Cheesecake Vasco: AGOTADO (0) -> Dispara Rollback 400
        WHEN s.SucursalID = 1 AND p.ProductoID = 25 THEN 0.000   -- Eclair Avellana: AGOTADO (0) -> Dispara Rollback 400
        WHEN s.SucursalID = 1 AND p.ProductoID = 19 THEN 4.000   -- Pastel Tres Leches: STOCK CRITICO (4)
        WHEN s.SucursalID = 1 AND p.ProductoID = 16 THEN 7.000   -- Croissant Frances: STOCK CRITICO (7)
        WHEN s.SucursalID = 1 AND p.ProductoID = 23 THEN 6.000   -- Milhojas Vainilla: STOCK CRITICO (6)
        WHEN p.EsInsumo = 1 THEN CAST(18 + ((s.SucursalID * 13 + p.ProductoID * 7) % 45) AS DECIMAL(12,3))
        WHEN p.ProductoID IN (11, 12) THEN CAST(140 + ((s.SucursalID * 29 + p.ProductoID * 11) % 180) AS DECIMAL(12,3))
        ELSE CAST(22 + ((s.SucursalID * 17 + p.ProductoID * 9) % 75) AS DECIMAL(12,3))
    END
FROM Sucursales s
CROSS JOIN Productos p;

-- =================================================================================
-- 6. GENERACIÓN DETERMINISTA DE 3 AÑOS DE OPERACIÓN (2024-01-01 A 2026-11-24)
--    ~1,280 Compras + ~3,840 CompraDetalle | ~14,500 Ventas + ~41,000 VentaDetalle
-- =================================================================================

-- 6A. COMPRAS A PROVEEDORES (3 AÑOS)
;WITH TallyDias AS (
    SELECT TOP 1059
        DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1, CAST('2024-01-01' AS DATE)) AS Fecha,
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS DiaIdx
    FROM sys.all_objects a
    CROSS JOIN (SELECT 1 AS n UNION ALL SELECT 2) b
),
OrdenesBase AS (
    SELECT
        d.Fecha,
        d.DiaIdx,
        s.SucursalID,
        ((d.DiaIdx + s.SucursalID * 3) % 20) + 1 AS ProveedorID,
        CASE s.SucursalID
            WHEN 1 THEN 7
            WHEN 2 THEN 8
            WHEN 3 THEN 14
            WHEN 4 THEN 23
            ELSE 24
        END AS EmpleadoID
    FROM TallyDias d
    CROSS JOIN Sucursales s
    WHERE (d.DiaIdx + s.SucursalID * 2) % 4 = 0 -- Recepción de insumos cada ~4 días por sucursal (~1,320 órdenes)
)
INSERT INTO Compras (ProveedorID, SucursalID, EmpleadoID, FechaRecepcion, Total)
SELECT ProveedorID, SucursalID, EmpleadoID, Fecha, 0.00
FROM OrdenesBase
ORDER BY Fecha, SucursalID;

-- Tres insumos recibidos por cada orden de compra (~3,960 líneas CompraDetalle)
INSERT INTO CompraDetalle (CompraID, ProductoID, Cantidad, CostoUnitario)
SELECT
    c.CompraID,
    p.ProductoID,
    CAST(4 + ((c.CompraID + k.Linea * 5) % 14) AS DECIMAL(10,3)) AS Cantidad,
    ROUND(p.CostoPromedio * (0.94 + ((c.CompraID % 13) * 0.01)), 2) AS CostoUnitario
FROM Compras c
CROSS APPLY (VALUES (1), (2), (3)) AS k(Linea)
INNER JOIN Productos p
    ON p.ProductoID = 37 + ((c.CompraID * 3 + k.Linea * 5) % 12);

-- Sincronizar Total exacto en cabecera Compras
UPDATE c
SET c.Total = d.SumaTotal
FROM Compras c
INNER JOIN (
    SELECT CompraID, ROUND(SUM(Cantidad * CostoUnitario), 2) AS SumaTotal
    FROM CompraDetalle
    GROUP BY CompraID
) d ON c.CompraID = d.CompraID;

-- 6B. VENTAS HISTÓRICAS DE 3 AÑOS CON ESTACIONALIDAD REAL DE PANADERÍA (2024 - 2026)
;WITH TallyDias AS (
    SELECT TOP 1059
        DATEADD(DAY, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1, CAST('2024-01-01' AS DATETIME)) AS FechaBase,
        ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS DiaIdx
    FROM sys.all_objects a
    CROSS JOIN (SELECT 1 AS n UNION ALL SELECT 2) b
),
SlotsDiarios AS (
    -- Hasta 22 tickets muestras representativos por día ponderados por año y temporada (~14,800 tickets)
    SELECT TOP 22 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS Slot
    FROM sys.all_objects
),
TicketsGenerados AS (
    SELECT
        d.DiaIdx,
        s.Slot,
        -- Ponderación de sucursal (Matriz y Norte tienen mayor tráfico)
        CASE
            WHEN (d.DiaIdx + s.Slot) % 10 IN (0, 1, 2) THEN 1
            WHEN (d.DiaIdx + s.Slot) % 10 IN (3, 4) THEN 2
            WHEN (d.DiaIdx + s.Slot) % 10 IN (5, 6) THEN 3
            WHEN (d.DiaIdx + s.Slot) % 10 IN (7, 8) THEN 4
            ELSE 5
        END AS SucursalID,
        DATEADD(MINUTE,
            420 + ((s.Slot * 37 + d.DiaIdx * 11) % 780), -- Horario comercial 07:00 a 20:00 hrs
            d.FechaBase
        ) AS FechaHora,
        YEAR(d.FechaBase) AS Anio,
        MONTH(d.FechaBase) AS Mes
    FROM TallyDias d
    CROSS JOIN SlotsDiarios s
    WHERE
        -- Crecimiento orgánico 2024 -> 2025 -> 2026 + Picos estacionales Enero (Roscas) y Oct-Nov (Pan de Muerto)
        s.Slot <= (
            CASE YEAR(d.FechaBase)
                WHEN 2024 THEN 10
                WHEN 2025 THEN 13
                ELSE 16
            END
            + CASE
                WHEN MONTH(d.FechaBase) = 1 THEN 5          -- Temporada Rosca de Reyes
                WHEN MONTH(d.FechaBase) IN (10, 11) THEN 5  -- Temporada Pan de Muerto y Otoño
                WHEN MONTH(d.FechaBase) = 12 THEN 4         -- Cenas Decembrinas
                WHEN MONTH(d.FechaBase) IN (6, 7) THEN -1   -- Verano cálido
                ELSE 1
            END
        )
)
INSERT INTO Ventas (SucursalID, EmpleadoID, ClienteID, TipoImpuestoID, FechaHora, Subtotal, TotalImpuestos, Total, Estatus)
SELECT
    t.SucursalID,
    CASE t.SucursalID
        WHEN 1 THEN CHOOSE((t.Slot % 3) + 1, 2, 4, 6)
        WHEN 2 THEN CHOOSE((t.Slot % 3) + 1, 8, 10, 12)
        WHEN 3 THEN CHOOSE((t.Slot % 3) + 1, 14, 16, 18)
        WHEN 4 THEN CHOOSE((t.Slot % 2) + 1, 19, 21)
        ELSE CHOOSE((t.Slot % 2) + 1, 24, 26)
    END AS EmpleadoID,
    -- 68% Mostrador General, 32% Clientes B2B / Convenios / VIP
    CASE
        WHEN (t.DiaIdx + t.Slot) % 3 = 0 THEN ((t.DiaIdx * 3 + t.Slot * 7) % 59) + 2
        ELSE 1
    END AS ClienteID,
    CASE
        WHEN (t.DiaIdx + t.Slot) % 9 = 0 THEN 2 -- Tasa 0%
        WHEN (t.DiaIdx + t.Slot) % 15 = 0 THEN 3 -- IEPS 8%
        ELSE 1 -- IVA 16%
    END AS TipoImpuestoID,
    t.FechaHora,
    0.00,
    0.00,
    0.00,
    CASE
        WHEN (t.DiaIdx + t.Slot) % 97 = 0 THEN 'Cancelada'
        ELSE 'Completada'
    END AS Estatus
FROM TicketsGenerados t
ORDER BY t.FechaHora;

-- Generar entre 2 y 4 líneas por cada Venta (~42,000 registros en VentaDetalle)
-- Respetando productos de temporada (Rosca en Enero, Pan de Muerto en Oct/Nov) y volumen B2B vs Mostrador
INSERT INTO VentaDetalle (VentaID, ProductoID, Cantidad, PrecioUnitario)
SELECT
    v.VentaID,
    ProdCalc.ProductoID,
    CAST(
        CASE
            WHEN v.ClienteID BETWEEN 2 AND 10 THEN 6 + ((v.VentaID + k.ItemIdx * 3) % 16) -- Pedidos B2B Hoteles/Restaurantes
            WHEN ProdCalc.ProductoID IN (10, 19) THEN 1 + (v.VentaID % 2)                  -- Roscas / Pasteles enteros
            WHEN ProdCalc.ProductoID IN (11, 12) THEN 4 + ((v.VentaID + k.ItemIdx) % 10)   -- Bolillos y teleras por bolsa
            ELSE 1 + ((v.VentaID + k.ItemIdx * 2) % 4)                                     -- Pan dulce / café mostrador
        END
    AS DECIMAL(10,3)) AS Cantidad,
    p.PrecioVenta
FROM Ventas v
CROSS APPLY (
    SELECT 1 AS ItemIdx
    UNION ALL SELECT 2
    UNION ALL SELECT 3 WHERE (v.VentaID % 2) = 0
    UNION ALL SELECT 4 WHERE (v.VentaID % 5) = 0
) k
CROSS APPLY (
    SELECT
        CASE
            WHEN MONTH(v.FechaHora) = 1 AND k.ItemIdx = 1 AND (v.VentaID % 3) = 0 THEN 10          -- Rosca de Reyes en Enero
            WHEN MONTH(v.FechaHora) IN (10, 11) AND k.ItemIdx = 1 AND (v.VentaID % 2) = 0 THEN 9   -- Pan de Muerto en Oct-Nov
            ELSE ((v.VentaID * 5 + k.ItemIdx * 11) % 36) + 1                                       -- Los 36 productos vendibles
        END AS ProductoID
) ProdCalc
INNER JOIN Productos p ON p.ProductoID = ProdCalc.ProductoID;

-- Sincronizar Subtotal, TotalImpuestos y Total exactos al centavo en tabla Ventas
UPDATE v
SET
    v.Subtotal = agg.SubtotalCalculado,
    v.TotalImpuestos = ROUND(agg.SubtotalCalculado * ti.Porcentaje, 2),
    v.Total = agg.SubtotalCalculado + ROUND(agg.SubtotalCalculado * ti.Porcentaje, 2)
FROM Ventas v
INNER JOIN (
    SELECT VentaID, ROUND(SUM(Cantidad * PrecioUnitario), 2) AS SubtotalCalculado
    FROM VentaDetalle
    GROUP BY VentaID
) agg ON v.VentaID = agg.VentaID
INNER JOIN TipoImpuesto ti ON v.TipoImpuestoID = ti.TipoImpuestoID;
GO

-- =================================================================================
-- 7. ÍNDICES NO AGRUPADOS CUBRIENTES DE ALTO RENDIMIENTO (DATABASE MASTERY)
-- =================================================================================
CREATE NONCLUSTERED INDEX IX_Ventas_FechaHora_Sucursal
ON dbo.Ventas (FechaHora, SucursalID)
INCLUDE (Total, Subtotal, TotalImpuestos, Estatus, ClienteID);

CREATE NONCLUSTERED INDEX IX_VentaDetalle_VentaID_ProductoID
ON dbo.VentaDetalle (VentaID, ProductoID)
INCLUDE (Cantidad, PrecioUnitario);

CREATE NONCLUSTERED INDEX IX_VentaDetalle_ProductoID
ON dbo.VentaDetalle (ProductoID)
INCLUDE (VentaID, Cantidad, PrecioUnitario);

CREATE NONCLUSTERED INDEX IX_Compras_FechaRecepcion_Sucursal
ON dbo.Compras (FechaRecepcion, SucursalID)
INCLUDE (Total, ProveedorID);
GO

-- Resumen de verificación final
SELECT
    (SELECT COUNT(*) FROM Sucursales) AS Sucursales,
    (SELECT COUNT(*) FROM Empleados) AS Empleados,
    (SELECT COUNT(*) FROM Clientes) AS Clientes,
    (SELECT COUNT(*) FROM Proveedores) AS Proveedores,
    (SELECT COUNT(*) FROM Productos) AS Productos,
    (SELECT COUNT(*) FROM Inventario) AS Inventario,
    (SELECT COUNT(*) FROM Compras) AS Compras,
    (SELECT COUNT(*) FROM CompraDetalle) AS CompraDetalle,
    (SELECT COUNT(*) FROM Ventas) AS Ventas,
    (SELECT COUNT(*) FROM VentaDetalle) AS VentaDetalle;
GO
