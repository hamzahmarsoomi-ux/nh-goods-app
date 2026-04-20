from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# السماح للتطبيق بالاتصال بالباك-إند
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/deals")
async def get_deals():
    # هذه المنتجات سحبناها مباشرة من McLane Xpress
    items = [
        {"name": "SkinnyPop 1oz Original (12ct)", "cost": 14.49},
        {"name": "REESE'S Filled Pretzels (12ct)", "cost": 22.64},
        {"name": "Blue Raspberry Sour Strip Candy", "cost": 26.08},
        {"name": "Dot's Pretzels Honey Mustard", "cost": 28.55},
        {"name": "REESE'S Peanut Butter Cups (36ct)", "cost": 45.41},
        {"name": "KIT KAT Wafer Bar (36ct)", "cost": 45.41}
    ]
    
    processed = []
    for item in items:
        # حسبة حمزة: زيادة 15% ولا تتجاوز 2.50$
        markup = item['cost'] * 0.15
        final_markup = markup if markup <= 2.50 else 2.50
        
        processed.append({
            "name": item['name'],
            "price": round(item['cost'] + final_markup, 2),
            "original_cost": item['cost'],
            "tag": "TODAY'S DEAL"
        })
    return processed

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
