# Apply Product Board + DevOps Sync Frontend

```powershell
cd C:\Users\Zordr\Desktop\zordrax-frontend
npm install xlsx

New-Item -ItemType Directory -Force .\lib
New-Item -ItemType Directory -Force .\app\product-board
New-Item -ItemType Directory -Force .\app\product-board\load
New-Item -ItemType Directory -Force .\app\product-board\status
New-Item -ItemType Directory -Force .\app\product-board\approvals
New-Item -ItemType Directory -Force .\app\orchestrator

Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\lib\zordrax-product-board-store.ts .\lib\zordrax-product-board-store.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\lib\zordrax-product-board-client.ts .\lib\zordrax-product-board-client.ts -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\app\orchestrator\product-board-panel.tsx .\app\orchestrator\product-board-panel.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\app\product-board\page.tsx .\app\product-board\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\app\product-board\load\page.tsx .\app\product-board\load\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\app\product-board\status\page.tsx .\app\product-board\status\page.tsx -Force
Copy-Item C:\Users\Zordr\Desktop\zordrax_product_board_devops_pack\frontend-repo\app\product-board\approvals\page.tsx .\app\product-board\approvals\page.tsx -Force
```

Optional cockpit wire:

```tsx
import ProductBoardPanel from "./product-board-panel";
<ProductBoardPanel />
```

Build and push:

```powershell
npm run build
git add .
git commit -m "Add product board DevOps sync and AI release pages"
git push github main
git push origin main
```
