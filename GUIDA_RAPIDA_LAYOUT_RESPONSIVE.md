# 🎨 Guida Rapida - Layout Responsive Personalizzazione Form

## 📐 Rapporti Sidebar/Preview per Dimensione Schermo

### 📱 Mobile (fino a 768px)
```
┌─────────────────────┐
│                     │
│   SIDEBAR (100%)    │
│                     │
├─────────────────────┤
│                     │
│   PREVIEW (100%)    │
│                     │
└─────────────────────┘
```
**Layout verticale** - Sidebar sopra, Preview sotto

---

### 📱 Tablet (769px - 1280px)
```
┌──────────────┬───────────────────┐
│              │                   │
│   SIDEBAR    │     PREVIEW       │
│     40%      │       60%         │
│              │                   │
└──────────────┴───────────────────┘
```
**Rapporto 40:60** - Più spazio per preview

---

### 💻 Laptop (1281px - 1536px)
```
┌─────────────┬────────────────────┐
│             │                    │
│  SIDEBAR    │      PREVIEW       │
│    35%      │        65%         │
│             │                    │
└─────────────┴────────────────────┘
```
**Rapporto 35:65** - Equilibrato

---

### 🖥️ Desktop (1537px - 1920px)
```
┌────────────┬─────────────────────┐
│            │                     │
│  SIDEBAR   │      PREVIEW        │
│    30%     │        70%          │
│            │                     │
└────────────┴─────────────────────┘
```
**Rapporto 30:70** - Standard (come prima, ma con altezza ottimizzata)

---

### 🖥️ Large Desktop (> 1920px)
```
┌──────────┬───────────────────────┐
│          │                       │
│ SIDEBAR  │       PREVIEW         │
│   25%    │         75%           │
│          │                       │
└──────────┴───────────────────────┘
```
**Rapporto 25:75** - Focus su anteprima
- Sidebar: min 350px, max 450px
- Altezza max: 900px

---

### 🖥️ Extra Large (> 2560px)
```
┌────────┬─────────────────────────┐
│        │                         │
│SIDEBAR │        PREVIEW          │
│  20%   │          80%            │
│        │                         │
└────────┴─────────────────────────┘
```
**Rapporto 20:80** - Massimo spazio per preview
- Sidebar: min 380px, max 500px
- Altezza max: 1000px

---

## 📏 Limiti di Altezza per Schermi Grandi

### Perché limitare l'altezza?
Su schermi molto grandi (es. 4K verticali), un'altezza di `92vh` può risultare eccessiva e poco ergonomica. I limiti di altezza massima garantiscono:
- ✅ Contenuto visibile senza scrolling eccessivo
- ✅ Migliore ergonomia visiva
- ✅ Focus sui contenuti importanti

### Limiti Applicati:

| Altezza Schermo | Altezza Max Container |
|-----------------|----------------------|
| < 900px         | 92vh - 80px          |
| 900px - 1080px  | 850px                |
| 1080px - 1440px | 950px                |
| > 1440px        | 1100px               |

---

## 🎯 Esempi Pratici

### Scenario 1: MacBook Pro 16" (1920x1080)
- **Sidebar**: 30% (576px)
- **Preview**: 70% (1344px)
- **Altezza**: 850px max
- ✨ **Risultato**: Layout bilanciato, perfetto per lavorare

### Scenario 2: iMac 27" (2560x1440)
- **Sidebar**: 20% (512px)
- **Preview**: 80% (2048px)
- **Altezza**: 950px max
- ✨ **Risultato**: Ampio spazio per anteprima dettagliata

### Scenario 3: Monitor Ultra-Wide (3440x1440)
- **Sidebar**: 380px (min-width applicata)
- **Preview**: Resto dello spazio (3060px)
- **Altezza**: 950px max
- ✨ **Risultato**: Sidebar ottimale, preview extra-large

### Scenario 4: iPad Pro (1024x768)
- **Sidebar**: 40% (410px)
- **Preview**: 60% (614px)
- **Altezza**: calc(85vh - 80px)
- ✨ **Risultato**: Proporzionato per tablet

---

## 💡 Tips per Sviluppatori

### Come testare rapidamente:
1. Apri Chrome DevTools (F12)
2. Attiva la modalità Device Toolbar (Ctrl+Shift+M)
3. Seleziona diverse dimensioni predefinite o personalizza
4. Osserva come il layout si adatta automaticamente

### Breakpoint chiave da testare:
- 📱 **768px** - Switch mobile/tablet
- 💻 **1280px** - Switch tablet/laptop
- 🖥️ **1536px** - Switch laptop/desktop
- 🖥️ **1920px** - Switch desktop/large
- 🖥️ **2560px** - Switch large/extra-large

### Modificare i breakpoint:
Tutti i breakpoint sono definiti in `protomforms-frontend/src/index.css` nella sezione:
```css
/* CUSTOMIZATION LAYOUT RESPONSIVE STYLES */
```

---

## 🔍 Debugging

### Problema: Layout non responsive
**Soluzione**: Verifica che le classi CSS siano correttamente applicate:
- `customization-layout-container`
- `customization-sidebar`
- `customization-preview`

### Problema: Sidebar troppo stretta su schermi grandi
**Soluzione**: Controlla `min-width` e `max-width` nelle media queries

### Problema: Altezza eccessiva
**Soluzione**: Verifica i limiti di `max-height` nelle media queries

---

## 📚 Risorse Correlate

- **File modificati**:
  - `FormCustomizationV2.tsx`
  - `index.css`
  
- **Documentazione completa**: `OTTIMIZZAZIONE_LAYOUT_RESPONSIVE.md`

---

**Ultimo aggiornamento**: 5 Novembre 2025










