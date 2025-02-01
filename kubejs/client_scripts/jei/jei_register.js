const { $InputConstants } = require("packages/com/mojang/blaze3d/platform/$InputConstants");
const { $RenderSystem } = require("packages/com/mojang/blaze3d/systems/$RenderSystem");
const { $Axis } = require("packages/com/mojang/math/$Axis");
const { $GameRenderer } = require("packages/net/minecraft/client/renderer/$GameRenderer");
const { $LightTexture } = require("packages/net/minecraft/client/renderer/$LightTexture");
const { $OverlayTexture } = require("packages/net/minecraft/client/renderer/texture/$OverlayTexture");
const { $SimpleSoundInstance } = require("packages/net/minecraft/client/resources/sounds/$SimpleSoundInstance");
const { $SoundEvents } = require("packages/net/minecraft/sounds/$SoundEvents");

JEIAddedEvents.registerCategories(event => {
    event.custom('kubejsadditions:block_crafting', category => {
        let guiHelper = category.jeiHelpers.getGuiHelper()
        let width = (9 * 18) + 10
        let height = 60 + (10 + (18 * 3) + 5)
        let exploded = false
        let singleLayer = false
        let singleLayerOffset = 0
        let explodeMulti = 1.0
        let explodeToggle = new ScreenArea(30, 75, 10, 10)
        let layerUp = new ScreenArea(55, 75, 10, 10)
        let layerSwap = new ScreenArea(70, 75, 10, 10)
        let layerDown = new ScreenArea(85, 75, 10, 10)
        let scissorBounds = new ScreenArea(27, 0, 70, 70)

        let CATALYST = Text.translate('kubejsadditions.jei.blockcrafting.catalyst').gold().italic()
        let COMPONENT = Text.translate('kubejsadditions.jei.blockcrafting.component').gray().italic()

        category.title(Text.translatable('kubejsadditions.jei.blockcrafting.title'))
            // 设置背景为空白的可绘制画布
            .background(guiHelper.createBlankDrawable(width, height))
            // 设置背景为自定义图形的可绘制画布
            // .background(guiHelper.createDrawable(new ResourceLocation('kubejs', 'textures/gui/jei-arrow-outputs.png'), 0, 0, 24, 19))
            // 设置图标
            .icon(guiHelper.createDrawableItemStack(Item.of('minecraft:cactus')))
            // 设置回调函数，该函数将验证配方是否是此类别的有效配方
            .isRecipeHandled((recipe) => {
                return !!(
                    recipe?.data?.recipeSize !== undefined &&
                    recipe?.data?.pattern !== undefined &&
                    recipe?.data?.catalyst !== undefined &&
                    recipe?.data?.components !== undefined &&
                    recipe?.data?.outputs !== undefined
                )
            })
            // 设置回调函数，使 JEI 能够索引此配方并确定，每个配方的输入和输出是什么
            .handleLookup((builder, recipe, focuses) => {
                let slotDrawable = guiHelper.getSlotDrawable()
                //催化剂
                builder.addSlot('catalyst', 1, 1).setBackground(slotDrawable, -1, -1)
                    .addTooltipCallback((slot, c) => c.add(CATALYST)).addItemStack(Item.of(recipe.data.catalyst))
                //输入
                let blockCounts = MultiBlock(recipe.data.pattern, recipe.data.components).counts
                let inputOffset = 0
                for (var key in blockCounts) {
                    var x = (18 * (inputOffset % 9)) + 5
                    var y = (18 * Math.floor(inputOffset / 9)) + height - 18 * 2 - 3
                    builder.addSlot('input', x, y).setBackground(slotDrawable, -1, -1)
                        .addTooltipCallback((slot, c) => c.add(COMPONENT)).addItemStack(Item.of(key, blockCounts[key]))
                    inputOffset++
                }
                for (var i = inputOffset; i < 18; i++) {
                    var x = (18 * (i % 9)) + 5
                    var y = (18 * Math.floor(i / 9)) + height - 18 * 2 - 3
                    builder.addSlot('input', x, y).setBackground(slotDrawable, -1, -1)
                }
                //输出
                for (var i = 0; i < 6; i++) {
                    var x = (18 * (i % 2)) + width - 18 * 2 - 5
                    var y = (18 * Math.floor(i / 2)) + scissorBounds.height / 2 - 18 * 1.5
                    builder.addSlot('output', x, y).setBackground(slotDrawable, -1, -1)
                        .addItemStack(Item.of(recipe.data.outputs[i]))
                }
            })
            // 设置回调函数，以便在屏幕上渲染其他细节.
            .setDrawHandler((recipe, recipeSlotsView, guiGraphics, mouseX, mouseY) => {
                function drawScaledTexture(texture, area, u, v, uWidth, vHeight, textureWidth, textureHeight) {
                    $RenderSystem.setShader(() => $GameRenderer.getPositionTexShader())
                    $RenderSystem.setShaderTexture(0, texture)
                    $RenderSystem.setShaderColor(1.0, 1.0, 1.0, 1.0)
                    $RenderSystem.enableDepthTest()
                    guiGraphics.blit(texture, area.x, area.y, area.width, area.height, u, v, uWidth, vHeight, textureWidth, textureHeight)
                }
                //绘制背景
                drawScaledTexture(new ResourceLocation('kubejs', "textures/gui/jei-arrow-field.png"),
                    new ScreenArea(7, 20, 17, 22),
                    0, 0, 17, 22, 17, 22);
                guiHelper.getRecipeArrow().draw(guiGraphics, 100, (scissorBounds.height - guiHelper.getRecipeArrow().getHeight())/2)
                //绘制按钮
                let sprites = new ResourceLocation('kubejs', 'textures/gui/jei-sprites.png')
                if (exploded) {
                    drawScaledTexture(sprites, explodeToggle, 20, 0, 20, 20, 120, 20)
                } else {
                    drawScaledTexture(sprites, explodeToggle, 0, 0, 20, 20, 120, 20)
                }
                if (singleLayer) {
                    drawScaledTexture(sprites, layerSwap, 60, 0, 20, 20, 120, 20)
                } else {
                    drawScaledTexture(sprites, layerSwap, 40, 0, 20, 20, 120, 20)
                }
                if (singleLayer) {
                    if (singleLayerOffset < recipe.data.recipeSize - 1) drawScaledTexture(sprites, layerUp, 80, 0, 20, 20, 120, 20)
                    if (singleLayerOffset > 0) drawScaledTexture(sprites, layerDown, 100, 0, 20, 20, 120, 20)
                }
                //渲染区域
                guiGraphics.fill(scissorBounds.x, scissorBounds.y, scissorBounds.x + scissorBounds.width, scissorBounds.height, 0x55404040)

                let mx = guiGraphics.pose()
                let buffer = guiGraphics.bufferSource()
                let gameTime = Client.level.getDayTime()
                let blockRender = Client.blockRenderer
                let multiBlock = MultiBlock(recipe.data.pattern, recipe.data.components).multiBlock

                mx.pushPose()
                mx.translate(scissorBounds.x + scissorBounds.width / 2, scissorBounds.y + scissorBounds.height / 2, 100)
                let dimsVec = new Vec3d(recipe.data.recipeSize, recipe.data.recipeSize, recipe.data.recipeSize)
                let previewScale = ((3 + Math.exp(3 - (dimsVec.length() / 5))) / explodeMulti)
                mx.scale(previewScale, -previewScale, previewScale)
                mx.mulPose($Axis.XP.rotationDegrees(35))
                mx.mulPose($Axis.YP.rotationDegrees(gameTime % 360))
                let translationOffset = -recipe.data.recipeSize / 2 - explodeMulti + 1
                mx.translate(translationOffset, translationOffset, explodeMulti - 0.5)
                multiBlock.forEach(block => {
                    if (singleLayer) {
                        if (block.pos.y !== singleLayerOffset) return
                    }
                    mx.pushPose()
                    mx.translate(
                        block.pos.x * explodeMulti,
                        block.pos.y * explodeMulti,
                        block.pos.z * explodeMulti)
                    blockRender.renderSingleBlock(block.block.defaultBlockState(), mx, buffer, $LightTexture.FULL_BLOCK, $OverlayTexture.NO_OVERLAY)
                    mx.popPose()
                })
                mx.popPose()
                buffer.endBatch()
            })
            // 设置回调函数，以便在用户与屏幕交互时处理输入。
            .setInputHandler((recipe, mouseX, mouseY, input) => {
                if (input == $InputConstants.getKey('key.mouse.left')) {
                    let handler = Client.soundManager
                    let sound = $SimpleSoundInstance.forUI($SoundEvents.UI_BUTTON_CLICK.value(), 1.0)
                    if (explodeToggle.contains(mouseX, mouseY)) {
                        explodeMulti = exploded ? 1.0 : 1.6
                        exploded = !exploded
                        handler.play(sound)
                    }
                    if (layerSwap.contains(mouseX, mouseY)) {
                        singleLayer = !singleLayer
                        handler.play(sound)
                    }
                    if (layerUp.contains(mouseX, mouseY) && singleLayer) {
                        if (singleLayerOffset < recipe.data.recipeSize - 1) {
                            singleLayerOffset++
                            handler.play(sound)
                        }
                    }
                    if (layerDown.contains(mouseX, mouseY) && singleLayer) {
                        if (singleLayerOffset > 0) {
                            singleLayerOffset--
                            handler.play(sound)
                        }
                    }
                }
                return false
            })
            // 设置回调函数，以便在鼠标悬停时显示工具提示。
            .setTooltipHandler((recipe, recipeSlotsView, mouseX, mouseY) => {
                if (explodeToggle.contains(mouseX, mouseY)) {
                    if (!exploded) return [Component.translatable("kubejsadditions.jei.blockcrafting.toggle_exploded_view")]
                    else return [Component.translatable("kubejsadditions.jei.blockcrafting.toggle_condensed_view")]
                }
                if (layerSwap.contains(mouseX, mouseY)) {
                    if (singleLayer) return [Component.translatable("kubejsadditions.jei.blockcrafting.all_layers_mode")]
                    else return [Component.translatable("kubejsadditions.jei.blockcrafting.single_layer_mode")]
                }
                if (layerUp.contains(mouseX, mouseY) && singleLayer) {
                    if (singleLayerOffset < recipe.data.recipeSize - 1)
                        return [Component.translatable("kubejsadditions.jei.blockcrafting.layer_up")]
                }
                if (layerDown.contains(mouseX, mouseY) && singleLayer) {
                    if (singleLayerOffset > 0)
                        return [Component.translatable("kubejsadditions.jei.blockcrafting.layer_down")]
                }
                return []
            })
    })
});
// 在这里，我们可以挂钩 JEI 食谱注册事件，将一些食谱添加到我们新创建的类别中
JEIAddedEvents.registerRecipes(event => {
    // 这就利用了您在此新设的食谱类别
    // 如果你希望它是一个对象、一个数组、一个字符串、一个数字、一个布尔值，甚至是一个函数，这都无所谓。
    let cb = event.custom('kubejsadditions:block_crafting')
    for (const key of global.testRecipe) {
        cb.add({ recipeSize: key.recipeSize, pattern: key.pattern, catalyst: key.catalyst, components: key.components, outputs: key.outputs })
    }
    // .add([])
    // .add('')
    // .add(true)
    // .add(50)
    // .add(12.4)
    // .add(()=> Item.of('steak'))
});

JEIAddedEvents.registerRecipeCatalysts(event => {
    event.data['addRecipeCatalyst(net.minecraft.world.item.ItemStack,mezz.jei.api.recipe.RecipeType[])'](Item.of('minecraft:redstone_lamp'), 'kubejsadditions:block_crafting')
})

//屏幕区域
function ScreenArea(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}
//判断是否在区域内
ScreenArea.prototype.contains = function (mouseX, mouseY) {
    return mouseX >= this.x && mouseX < this.x + this.width && mouseY >= this.y && mouseY < this.y + this.height
};
/**
 * 生成多块结构的函数
 * @param {Array} pattern - 表示多块结构的模式数组
 * @param {Object} dict - 字符到方块ID的映射字典
 * @returns  - 包含方块位置和方块对象的数组
 */
function MultiBlock(pattern, components) {
    let multiBlock = []
    let counts = {}
    for (let i = 0; i < pattern.length; i++) {
        var layer = pattern[i]
        for (let j = 0; j < layer.length; j++) {
            var line = layer[j]
            for (let k = 0; k < line.length; k++) {
                var pos = new BlockPos(i, j, -k)
                var ch = line.charAt(k)
                var block = components[ch]
                if (counts[block] === undefined) {
                    counts[block] = 0
                }
                counts[block] += 1
                multiBlock.push({ pos: pos, block: Block.getBlock(block) })
            }
        }
    }
    return { multiBlock: multiBlock, counts: counts }
}