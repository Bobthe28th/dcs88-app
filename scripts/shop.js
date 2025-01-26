(function () {
    function createItem(name, id, cost, stock, storage, sale) {
        return `<div class="shopitem">
        <img src="../assets/items/${id}.png">
        <h3>${name}</h3>
        <h2>$${cost}</h2>
        <p>${stock} left in stock</p>
        <p>${storage} in storage</p>
        <div class="quantity">
        <div class="plus">+</div>
        <input type="number" class="quantityVal" value="0"></div>
        <div class="minus">-</div>
        </div>
        </div>`;
    }
})();