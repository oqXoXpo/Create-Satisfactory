// priority: 0

ItemEvents.rightClicked('minecraft:diamond', event => {
    let player = event.player;
    let item = event.item;
    let tool = player.mainHandItem;
    if (player.offHandItem != item || player.mainHandItem == 'minecraft:air') {
        return player.tell('如果要使工具无法破坏，请将该道具放于副手，物品放于主手')
    }
    else if (tool?.nbt && tool.nbt?.Unbreakable) {
        return player.tell('该物品已无法破坏！')
    }
    if (tool.nbt.Enchantments) {
        tool.nbt.Enchantments = tool.nbt.Enchantments.filter((tool) => {
            return tool.id != 'minecraft:unbreaking'
        })
    }
    tool.nbt.merge({ Unbreakable: 1 })
    item.shrink(1);
})

//测试配方
global.testRecipe = [
    {
        'type': 'compactcrafting:miniaturization',
        'recipeSize': 3,
        'pattern': [
            ['AAA', 'CDC', 'CCC'],
            ['BBB', 'CDC', 'CCC'],
            ['CCC', 'CDC', 'CCC']
        ],
        'components': {
            'A': 'minecraft:stone',
            'B': 'minecraft:stone',
            'C': 'minecraft:coal_block',
            'D': 'minecraft:diamond_block'
        },
        'catalyst': '3x minecraft:diamond',
        'outputs': [
            '27x minecraft:diamond_block'
        ]
    }
]