# 🔧 Fix: Mongoose "next is not a function" Error

## ❌ Problema

```
Error: next is not a function
POST /api/users/connect 500 (Internal Server Error)
POST /api/loans/positions 500 (Internal Server Error)
```

## 🔍 Causa Raíz

El error ocurría porque teníamos un **conflicto entre dos sistemas de timestamps**:

### **1. Mongoose `timestamps: true` option**
```javascript
const schema = new mongoose.Schema({
    // ... fields
}, {
    timestamps: true  // ← Mongoose maneja createdAt y updatedAt automáticamente
});
```

### **2. Pre-save middleware manual**
```javascript
// ❌ CONFLICTO: Intentando hacer lo mismo manualmente
schema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});
```

**Problema:** Cuando usas `timestamps: true`, Mongoose ya maneja `createdAt` y `updatedAt` automáticamente. El middleware manual interfería con este proceso.

## ✅ Solución

Eliminar el middleware pre-save redundante de ambos modelos:

### **User.js - Antes:**
```javascript
}, {
    timestamps: true,
    collection: 'users'
});

// ❌ REDUNDANTE
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Method to update connection
userSchema.methods.recordConnection = function() {
    // ...
};
```

### **User.js - Después:**
```javascript
}, {
    timestamps: true,  // ← Esto es suficiente
    collection: 'users'
});

// ✅ Sin middleware redundante

// Method to update connection
userSchema.methods.recordConnection = function() {
    // ...
};
```

### **Position.js - Mismo fix aplicado**

## 🎯 Cómo Funciona `timestamps: true`

Cuando usas `timestamps: true`, Mongoose:

1. **Agrega automáticamente** dos campos:
   ```javascript
   {
       createdAt: Date,  // Se establece al crear
       updatedAt: Date   // Se actualiza en cada save()
   }
   ```

2. **Maneja automáticamente** las actualizaciones:
   ```javascript
   // Al crear
   const user = new User({ address: '0x...' });
   await user.save();
   // createdAt: 2025-12-06T02:00:00.000Z
   // updatedAt: 2025-12-06T02:00:00.000Z
   
   // Al actualizar
   user.connectionCount += 1;
   await user.save();
   // createdAt: 2025-12-06T02:00:00.000Z (no cambia)
   // updatedAt: 2025-12-06T02:05:00.000Z (actualizado!)
   ```

3. **No necesitas middleware** para esto

## 📊 Comparación

| Aspecto | Con Middleware Manual | Con timestamps: true |
|---------|----------------------|---------------------|
| **Código** | Más líneas | Menos líneas |
| **Mantenimiento** | Manual | Automático |
| **Errores** | ❌ Propenso a errores | ✅ Robusto |
| **Performance** | ⚠️ Overhead extra | ✅ Optimizado |
| **Conflictos** | ❌ Posibles | ✅ Ninguno |

## 🧪 Testing

### **1. Test User Connect:**
```bash
curl -X POST http://localhost:3001/api/users/connect \
  -H "Content-Type: application/json" \
  -d '{"address":"0x0C1ee65e59Cd82C1C6FF3bc0d5E612190F45264D"}'
```

**Esperado:**
```json
{
  "success": true,
  "message": "User registered",
  "user": {
    "address": "0x0c1ee65e59cd82c1c6ff3bc0d5e612190f45264d",
    "totalPositions": 0,
    "activePositions": 0,
    "connectionCount": 1,
    "firstConnectedAt": "2025-12-06T02:38:34.066Z",
    "lastConnectedAt": "2025-12-06T02:38:34.066Z"
  }
}
```

### **2. Test Create Position:**
```bash
curl -X POST http://localhost:3001/api/loans/positions \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x0C1ee65e59Cd82C1C6FF3bc0d5E612190F45264D",
    "protocol": "Uniswap",
    "adapterAddress": "0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178",
    "tokenSymbol": "WETH",
    "tokenAddress": "0x918530d86c239f92E58A98CE8ed446DC042613DB",
    "collateralAmount": 10,
    "collateralValueUSD": 25000,
    "borrowAmount": 17500,
    "platformFee": 175,
    "netReceived": 17325,
    "apy": "5.38%",
    "ltv": 0.70,
    "txHash": "0x1234567890abcdef...",
    "network": "sepolia"
  }'
```

**Esperado:**
```json
{
  "success": true,
  "position": {
    "id": "69339736f9a53e5be8fe972b",
    "userAddress": "0x0c1ee65e59cd82c1c6ff3bc0d5e612190f45264d",
    "protocol": "Uniswap",
    "tokenSymbol": "WETH",
    "collateralAmount": 10,
    "borrowAmount": 17500,
    "netReceived": 17325,
    "apy": "5.38%",
    "txHash": "0x1234567890abcdef...",
    "status": "active",
    "healthFactor": 1.14,
    "createdAt": "2025-12-06T02:38:46.027Z"
  }
}
```

## 💡 Lecciones Aprendidas

### **1. No duplicar funcionalidad**
Si Mongoose ya lo hace, no lo hagas manualmente.

### **2. Leer la documentación**
`timestamps: true` es una feature estándar de Mongoose.

### **3. Usar herramientas built-in**
Las features nativas están optimizadas y probadas.

### **4. Evitar middleware innecesario**
Cada middleware agrega overhead.

## 🔍 Debugging Tips

Si ves "next is not a function":

1. **Revisa tus middlewares:**
   ```javascript
   schema.pre('save', function(next) {
       // ¿Estás llamando next()?
       next();
   });
   ```

2. **Verifica conflictos con timestamps:**
   ```javascript
   // ¿Tienes timestamps: true?
   // ¿Y también middleware para updatedAt?
   // ← Conflicto!
   ```

3. **Usa arrow functions con cuidado:**
   ```javascript
   // ❌ MAL - Arrow function no tiene 'this'
   schema.pre('save', (next) => {
       this.updatedAt = new Date();  // 'this' es undefined
       next();
   });
   
   // ✅ BIEN - Function expression tiene 'this'
   schema.pre('save', function(next) {
       this.updatedAt = new Date();
       next();
   });
   ```

## ✅ Checklist de Verificación

- [x] Middleware pre-save eliminado de User.js
- [x] Middleware pre-save eliminado de Position.js
- [x] `timestamps: true` configurado en ambos schemas
- [x] POST /api/users/connect funciona
- [x] POST /api/loans/positions funciona
- [x] GET /api/loans/positions/:address funciona
- [x] Timestamps se actualizan automáticamente
- [x] No hay errores en logs del backend

---

**Problema resuelto! ✅**

Los endpoints de usuarios y posiciones ahora funcionan correctamente. Mongoose maneja los timestamps automáticamente sin necesidad de middleware manual.
