import * as React from 'react'

interface WeekMenuTableProps {
  cart: { mealId: string; quantity: number }[]
  addToCart: (mealId: string) => void
  removeFromCart: (mealId: string) => void
}

export default function WeekMenuTable({ cart, addToCart, removeFromCart }: WeekMenuTableProps) {
  const isInCart = (mealId: string) => {
    return cart.some(item => item.mealId === mealId)
  }

  // 完全按照PDF原始表格结构 - 6行数据
  const tableRows = [
    // 第1行: MAIN主餐 (rowspan=4) + Regular Main
    {
      mainCategory: 'MAIN主餐',
      mainRowspan: 4,
      subCategory: 'Regular Main 常规主餐',
      meals: [
        { id: 'w4-mon-1', content: 'Swedish Meatballs with Mild Pepper Gravy 瑞典肉丸 配温和胡椒肉汁 (LS)', check: '✓' },
        { id: 'w4-tue-1', content: 'Pork Steak with Smoky Peppernata Sauce 烟熏辣椒酱猪排 (LS)', check: '' },
        { id: 'w4-wed-1', content: 'Chicken Parmigiana 帕玛森鸡排 (LSF,LS)', check: '' },
        { id: 'w4-thu-1', content: 'Shepherd\'s Pie 牧羊人派 (LSF)', check: '' },
        { id: 'w4-fri-1', content: 'Crumbed Fish 裹粉炸鱼 (LSF,LS)', check: '' },
        { id: 'w4-sat-1', content: 'Roast Beef with Port Wine Sauce 波特酒酱烤牛肉 (LSF,LS)', check: '' },
        { id: 'w4-sun-1', content: 'Roast Chicken Thigh with Smoky BBQ Sauce 烟熏烧烤酱烤鸡腿 (LSF)', check: '' }
      ]
    },
    // 第2行: Easy to Chew Main
    {
      subCategory: 'Easy to Chew Main 易咀嚼主餐',
      meals: [
        { id: 'w4-mon-2', content: 'Creamy Mustard Chicken 奶油芥末鸡 (LSF)', check: '' },
        { id: 'w4-tue-2', content: 'Chilli Corn Carne 辣味玉米牛肉 (LSF,LS)', check: '✗' },
        { id: 'w4-wed-2', content: 'Pork & Cider Casserole 猪肉苹果酒炖菜 (LSF,LS)', check: '' },
        { id: 'w4-thu-2', content: 'Salmon Pasta Bake 三文鱼焗意面 (LSF)', check: '' },
        { id: 'w4-fri-2', content: 'Butter Chicken 印度黄油雞 (LSF)', check: '' },
        { id: 'w4-sat-2', content: 'Honey Pepper Pork 蜂蜜胡椒猪肉 (LSF)', check: '' },
        { id: 'w4-sun-2', content: 'Slow Cooked Lamb Casserole 慢炖羊肉砂锅 (LSF)', check: '' }
      ]
    },
    // 第3行: Vegetarian
    {
      subCategory: 'Vegetarian (7 business days notice is required) 素食 (需提前7个工作日通知)',
      meals: [
        { id: 'w4-mon-3', content: 'Spanish Risotto Slice 西班牙烩饭 (LS)', check: '' },
        { id: 'w4-tue-3', content: 'Vegetable Dahl 蔬菜达尔咖喱 (LSF,LS)', check: '' },
        { id: 'w4-wed-3', content: 'Potato Spinach Pie 土豆菠菜派', check: '1' },
        { id: 'w4-thu-3', content: 'Vegetable Pesto Pasta Bake 蔬菜青酱焗意面', check: '2' },
        { id: 'w4-fri-3', content: 'Indian Butter Tofu 印度黄油豆腐 (LSF,LS)', check: '' },
        { id: 'w4-sat-3', content: 'Veggie Slice 焗烤蔬菜 (LS)', check: '' },
        { id: 'w4-sun-3', content: 'Lentil Bolognaise 扁豆薄洛尼亚酱 (LSF,LS)', check: '' }
      ]
    },
    // 第4行: Main Meal (Farmdoor)
    {
      subCategory: 'Main Meal 主餐 (Farmdoor)',
      meals: [
        { id: 'w4-mon-4', content: 'Lambs Fry & bacon with Onion gravy & Mashed Potato 羊肝培根配洋葱肉汁和土豆泥', check: '' },
        { id: 'w4-tue-4', content: 'French Chicken Casserole 法式鸡肉炖菜 (GF,LS)', check: '' },
        { id: 'w4-wed-4', content: 'Savoury Beef Mince with Mash Potato 咸味牛肉碎配土豆泥 (GF,LSF)', check: '' },
        { id: 'w4-thu-4', content: 'Indian Butter Chicken with Steamed Rice 印度黄油鸡配蒸米饭 (GF,LS)', check: '' },
        { id: 'w4-fri-4', content: 'Vegetable Lasagna with Bechamel Sauce 蔬菜千层面配白酱 (LSF)', check: '' },
        { id: 'w4-sat-4', content: 'French Chicken Casserole 法式鸡肉炖菜 (GF,LS)', check: '' },
        { id: 'w4-sun-4', content: 'Savoury Beef Mince with Mash Potato 咸味牛肉碎配土豆泥 (GF,LSF)', check: '' }
      ]
    },
    // 第5行: DESERTS 甜点 (rowspan=2) + Sweet
    {
      mainCategory: 'DESERTS 甜点',
      mainRowspan: 2,
      subCategory: 'Sweet 甜点',
      meals: [
        { id: 'w4-mon-5', content: 'Coconut Baked Custard 椰香烤蛋奶 (DBF)', check: '' },
        { id: 'w4-tue-5', content: 'Apple, Pear & Rhubarb Cobbler with Custard 苹果、梨和大黄果脆 配蛋奶', check: '' },
        { id: 'w4-wed-5', content: 'Sultana Pudding with Custard 葡萄干布丁配蛋奶', check: '' },
        { id: 'w4-thu-5', content: 'Citrus, Ricotta & Almond Cake with Custard 柑橘、乳清干酪和杏仁蛋糕配蛋奶', check: '' },
        { id: 'w4-fri-5', content: 'Creamy Rice & Toffee Apple Puree 奶油米布丁 配太妃苹果泥 (DBF)', check: '' },
        { id: 'w4-sat-5', content: 'Jelly & Two Fruits Custard 果冻 配双拼水果蛋奶', check: '3' },
        { id: 'w4-sun-5', content: 'Peach Upside Down Cake with Custard 倒扣桃子蛋糕 配蛋奶', check: '' }
      ]
    },
    // 第6行: Fruit + Dairy
    {
      subCategory: 'Fruit + Dairy 水果 + 乳制品 (需提前7个工作日通知)',
      meals: [
        { id: 'w4-mon-6', content: 'Two Fruits with Custard 双拼水果配蛋奶 (DBF)', check: '' },
        { id: 'w4-tue-6', content: 'Fruit Salad with Yoghurt 水果沙拉配酸奶 (DBF)', check: '' },
        { id: 'w4-wed-6', content: 'Peaches with Custard 桃子配蛋奶 (DBF)', check: '' },
        { id: 'w4-thu-6', content: 'Spiced Apples with Yoghurt 香料苹果配酸奶 (DBF)', check: '' },
        { id: 'w4-fri-6', content: 'Mixed Fruit Compote 混合水果果酱', check: '' },
        { id: 'w4-sat-6', content: 'Pear with Yoghurt 梨配酸奶 (DBF)', check: '' },
        { id: 'w4-sun-6', content: 'Apricots with Custard 杏子配蛋奶 (DBF)', check: '' }
      ]
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs" style={{ minWidth: '1400px' }}>
          {/* 表头 */}
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '80px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '120px' }}>WEEK 4</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>MONDAY (一)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>TUESDAY (二)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>WEDNESDAY (三)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>THURSDAY (四)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>FRIDAY (五)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>SATURDAY (六)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '160px' }}>SUNDAY (日)</th>
              <th className="border border-white/30 p-2 text-center font-bold" style={{ width: '30px' }}></th>
            </tr>
          </thead>

          {/* 表格内容 */}
          <tbody>
            {tableRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* 主类别列 - 只在有mainCategory时渲染 */}
                {row.mainCategory && (
                  <td 
                    rowSpan={row.mainRowspan} 
                    className="border border-gray-400 p-2 text-center font-bold bg-orange-50 align-middle"
                    style={{ verticalAlign: 'middle' }}
                  >
                    {row.mainCategory}
                  </td>
                )}

                {/* 子类别列 */}
                <td className="border border-gray-400 p-2 text-center font-medium bg-gray-50 align-middle">
                  {row.subCategory}
                </td>

                {/* 7天的餐品 + 分隔列 */}
                {row.meals.map((meal, mealIndex) => (
                  <React.Fragment key={mealIndex}>
                    {/* 餐品单元格 */}
                    <td 
                      className={`border border-gray-400 p-2 text-center align-middle cursor-pointer transition-all hover:bg-orange-50 ${
                        isInCart(meal.id) ? 'bg-orange-100 ring-2 ring-orange-500' : 'bg-white'
                      }`}
                      onClick={() => isInCart(meal.id) ? removeFromCart(meal.id) : addToCart(meal.id)}
                      style={{ verticalAlign: 'middle' }}
                    >
                      <div className="relative">
                        <p className="text-[11px] leading-tight">{meal.content}</p>
                        {meal.check && (
                          <span className={`absolute top-0 right-0 font-bold ${
                            meal.check === '✗' ? 'text-red-500' : 'text-orange-500'
                          }`}>
                            {meal.check}
                          </span>
                        )}
                        {isInCart(meal.id) && (
                          <div className="absolute -top-2 -left-2 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs shadow-lg z-10">
                            ✓
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 分隔列（除了最后一天）*/}
                    {mealIndex < row.meals.length - 1 && (
                      <td className="border border-gray-400 p-0 bg-gray-100"></td>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 脚注说明 */}
      <div className="p-4 bg-gray-50 border-t border-gray-300 text-xs space-y-1">
        <p><strong>1.</strong> 土豆菠菜派 - 特殊选项</p>
        <p><strong>2.</strong> 蔬菜青酱焗意面 - 特殊选项</p>
        <p><strong>3.</strong> 果冻配双拼水果蛋奶 - 特殊选项</p>
        <p><strong>✗</strong> 表示该日不提供此餐品</p>
      </div>
    </div>
  )
}
