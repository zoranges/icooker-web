import * as React from 'react'
import { mockMeals } from '../store'

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const DAY_NAMES: Record<string, string> = {
  '周一': 'MONDAY (一)', '周二': 'TUESDAY (二)', '周三': 'WEDNESDAY (三)',
  '周四': 'THURSDAY (四)', '周五': 'FRIDAY (五)', '周六': 'SATURDAY (六)', '周日': 'SUNDAY (日)',
}

interface SubCategoryDef {
  subCategory: string
  label: string
  mainCategory?: string
  mainRowspan?: number
}

const SUB_CATEGORIES: SubCategoryDef[] = [
  { subCategory: 'Regular Main', label: 'Regular Main 常规主餐', mainCategory: 'MAIN主餐', mainRowspan: 4 },
  { subCategory: 'Easy to Chew Main', label: 'Easy to Chew Main 易咀嚼主餐' },
  { subCategory: 'Vegetarian', label: 'Vegetarian 素食', mainCategory: undefined, mainRowspan: undefined },
  { subCategory: 'Main Meal (Farmdoor)', label: 'Main Meal 主餐 (Farmdoor)' },
  { subCategory: 'Sweet', label: 'Sweet 甜点', mainCategory: 'DESSERTS 甜点', mainRowspan: 2 },
  { subCategory: 'Fruit + Dairy', label: 'Fruit + Dairy 水果 + 乳制品' },
]

interface WeekMenuTableProps {
  weekNumber?: number
  cart: { mealId: string; quantity: number }[]
  addToCart: (mealId: string) => void
  removeFromCart: (mealId: string) => void
}

export default function WeekMenuTable({ weekNumber = 4, cart, addToCart, removeFromCart }: WeekMenuTableProps) {
  const isInCart = (mealId: string) => cart.some(item => item.mealId === mealId)

  const tableRows = SUB_CATEGORIES.map(def => {
    const meals = DAYS.map(day => {
      const meal = mockMeals.find(
        m => m.weekNumber === weekNumber && m.dayOfWeek === day && m.subCategory === def.subCategory
      )
      return meal
    })
    return { ...def, meals }
  })

  const headerBg = 'hsl(15 55% 42%)'
  const mainCatBg = 'hsl(15 55% 42% / 0.06)'
  const subCatBg = 'hsl(30 12% 94%)'
  const borderColor = 'hsl(30 8% 90%)'
  const selectedBg = 'hsl(15 55% 42% / 0.08)'

  return (
    <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor }}>
      <table className="w-full border-collapse table-fixed text-sm">
        <thead>
          <tr style={{ background: headerBg, color: 'white' }}>
            <th className="border border-white/20 p-2.5 text-center font-display text-sm w-[6%]"></th>
            <th className="border border-white/20 p-2.5 text-center font-display text-sm w-[8%]">WEEK {weekNumber}</th>
            {DAYS.map(day => (
              <React.Fragment key={day}>
                <th className="border border-white/20 p-2.5 text-center font-semibold w-[11%]">{DAY_NAMES[day]}</th>
                <th className="border border-white/20 p-0 w-[2%]"></th>
              </React.Fragment>
            ))}
          </tr>
        </thead>

        <tbody>
          {tableRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.mainCategory && (
                <td
                  rowSpan={row.mainRowspan}
                  className="border p-2 text-center font-display text-sm font-bold align-middle"
                  style={{ borderColor, background: mainCatBg }}
                >
                  {row.mainCategory}
                </td>
              )}

              <td className="border p-2 text-center font-medium align-middle" style={{ borderColor, background: subCatBg }}>
                {row.label}
              </td>

              {row.meals.map((meal, mealIndex) => (
                <React.Fragment key={mealIndex}>
                  <td
                    className={`border p-2 text-center align-middle transition-all ${
                      meal ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    style={{
                      borderColor,
                      background: meal && isInCart(meal.id) ? selectedBg : meal ? 'white' : subCatBg,
                      ...(meal && isInCart(meal.id) ? { boxShadow: `inset 0 0 0 2px ${headerBg}` } : {}),
                    }}
                    onClick={() => {
                      if (!meal) return
                      isInCart(meal.id) ? removeFromCart(meal.id) : addToCart(meal.id)
                    }}
                  >
                    {meal && (
                      <div className="relative">
                        <p className="text-xs leading-snug break-words">
                          {meal.name}
                          {meal.dietaryTags && meal.dietaryTags.length > 0 && (
                            <span style={{ color: 'hsl(20 8% 50%)', fontSize: '10px' }}> ({meal.dietaryTags.join(',')})</span>
                          )}
                        </p>
                        {isInCart(meal.id) && (
                          <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white shadow-lg z-10" style={{ background: headerBg }}>
                            ✓
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {mealIndex < DAYS.length - 1 && (
                    <td className="border p-0" style={{ borderColor, background: 'hsl(30 10% 93%)' }}></td>
                  )}
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 text-[11px] leading-relaxed" style={{ background: 'hsl(30 12% 95%)', borderTop: `1px solid ${borderColor}`, color: 'hsl(20 8% 45%)' }}>
        <strong>LSF</strong>=低脂肪 &lt;1.5g/100g · <strong>DBF</strong>=适合糖尿病患者 &lt;15g糖/100g · <strong>LS</strong>=低钠 &lt;150mg/100g · <strong>GF</strong>=无麸质 · <strong>DF</strong>=无乳制品
      </div>
    </div>
  )
}
