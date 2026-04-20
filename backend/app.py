from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/deals")
async def get_deals():
    items = [
        {"name": "SkinnyPop 1oz Original (12ct) Case", "pack": "12 Pack, 1 OZ", "category": "Snacks", "mcl_price": 14.49, "image": "skinnypop"},
        {"name": "REESE'S Filled Pretzels With Peanut Butter Filling Peg Bag, 5 oz., 12 ct.", "pack": "12 Pack, 5 OZ", "category": "Snacks", "mcl_price": 22.64, "image": "reeses_pretzels"},
        {"name": "Blue Raspberry Sour Strip Candy", "pack": "12 Pack, 3.4 OZ", "category": "Candy", "mcl_price": 26.08, "image": "sour_strips"},
        {"name": "TWIZZLERS Strawberry Flavored Twists Peg Bag, 7 oz., 12 ct.", "pack": "12 Pack, 7 OZ", "category": "Candy", "mcl_price": 27.28, "image": "twizzlers"},
        {"name": "SHAQ-A-LICIOUS XL Gummies Sneakers", "pack": "12 Pack, 6.2 OZ", "category": "Candy", "mcl_price": 27.28, "image": "shaq_xl"},
        {"name": "Jolly Rancher Ropes Watermelon & Green Apple", "pack": "12 Pack, 6 OZ", "category": "Candy", "mcl_price": 27.28, "image": "jolly_ropes_wm"},
        {"name": "JOLLY RANCHER Hard Candy Original Flavors Assortment Peg Bag, 7 oz., 12 ct.", "pack": "12 Pack, 7 OZ", "category": "Candy", "mcl_price": 27.28, "image": "jolly_hard"},
        {"name": "JOLLY RANCHER ROPES Blue Raspberry & Cherry Flavored Candy Peg Bag, 6 oz.", "pack": "12 Pack, 6 OZ", "category": "Candy", "mcl_price": 28.28, "image": "jolly_ropes_wm"},
        {"name": "Dot's Pretzels Honey Mustard Seasoned Pretzels, 5oz 10 Count Case", "pack": "10 Pack, 5 OZ", "category": "Snacks", "mcl_price": 28.55, "image": "dots_honey"},
        {"name": "DOTS Homestyle Pretzels Buffalo Flavored Seasoned", "pack": "10 Pack, 5 OZ", "category": "Snacks", "mcl_price": 28.55, "image": "dots_honey"},
        {"name": "DOT'S Homestyle Pretzels Garlic Parmesan Seasoned Pretzel Twists Bag, 5 oz.", "pack": "10 Pack, 5 OZ", "category": "Snacks", "mcl_price": 28.55, "image": "dots_honey"},
        {"name": "DOTS Homestyle Original Snack Mix Bag 4.4 oz., 10", "pack": "10 Pack, 4.4 OZ", "category": "Snacks", "mcl_price": 28.55, "image": "dots_honey"},
        {"name": "PAYDAY PEANUT CARAMEL STANDARD BAR BOX", "pack": "24 Pack, 1.85 OZ", "category": "Candy", "mcl_price": 29.62, "image": "payday_std"},
        {"name": "Mounds Dark Chocolate & Coconut Standard Bar, Box", "pack": "24 Pack, 1.75 OZ", "category": "Candy", "mcl_price": 29.62, "image": "mounds"},
        {"name": "ALMOND JOY MILK CHOCOLATE, COCONUT & ALMOND STANDARD BAR", "pack": "24 Pack, 1.61 OZ", "category": "Candy", "mcl_price": 29.62, "image": "almond_joy"},
        {"name": "REESE'S Dipped Animal Crackers Peg Bag Bte Size Animal Cracker", "pack": "12 Pack, 4.25 OZ", "category": "Candy", "mcl_price": 29.97, "image": "reeses_pretzels"},
        {"name": "HERSHEY'S Milk Chocolate Dipped Pretzels, 4.25oz/ 12 count", "pack": "12 Pack, 4.25 OZ", "category": "Candy", "mcl_price": 29.97, "image": "hersheys_dipped_pretzels"},
        {"name": "REESE'S FAST BREAK King Size Bar, 3.5oz/ 18 count", "pack": "18 Pack, 3.5 OZ", "category": "Candy", "mcl_price": 39.44, "image": "reeses_fastbreak"},
        {"name": "PAYDAY Peanut Caramel Bar King Size, 3.4oz/ 18 count", "pack": "18 Pack, 3.4 OZ", "category": "Candy", "mcl_price": 39.44, "image": "payday_king"},
        {"name": "HERSHEY'S Milk Chocolate with Almonds King Size Bar, 2.6oz/ 18 count", "pack": "18 Pack, 2.6 OZ", "category": "Candy", "mcl_price": 39.44, "image": "hersheys_king"},
        {"name": "HERSHEY'S Milk Chocolate King Size Bar, 2.6oz/ 18 count", "pack": "18 Pack, 2.6 OZ", "category": "Candy", "mcl_price": 39.44, "image": "hersheys_king"},
        {"name": "REESE'S Peanut Butter Cups, 1.5oz/ 36 count", "pack": "36 Pack, 1.5 OZ", "category": "Candy", "mcl_price": 45.41, "image": "reeses_cups_box"},
    ]

    processed = []
    for item in items:
        our_price = round(item["mcl_price"] + 2.00, 2)
        processed.append({
            "name": item["name"],
            "pack": item["pack"],
            "category": item["category"],
            "price": our_price,
            "original_price": item["mcl_price"],
            "image": item["image"],
            "tag": "TODAY'S DEAL"
        })
    return processed

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
