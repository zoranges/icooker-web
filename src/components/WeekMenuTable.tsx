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

  const subCatBg = 'hsl(210 20% 98%)'
  const selectedBorder = 'hsl(168 72% 36%)'
  const selectedBg = 'hsl(168 72% 36% / 0.06)'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <table className="w-full border-collapse table-fixed text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
            <th className="border border-white/20 p-2.5 text-center text-sm font-bold w-[6%]"></th>
            <th className="border border-white/20 p-2.5 text-center text-sm font-bold w-[8%]">WEEK {weekNumber}</th>
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
                  className="border border-slate-200 bg-teal-50 p-2 text-center text-sm font-bold align-middle"
                >
                  {row.mainCategory}
                </td>
              )}

              <td className="border border-slate-200 bg-slate-50 p-2 text-center text-sm font-medium align-middle">
                {row.label}
              </td>

              {row.meals.map((meal, mealIndex) => (
                <React.Fragment key={mealIndex}>
                  <td
                    className={`border border-slate-200 p-2 text-center align-middle transition-all ${
                      meal ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    style={{
                      background: meal && isInCart(meal.id) ? selectedBg : meal ? 'white' : subCatBg,
                      ...(meal && isInCart(meal.id) ? { boxShadow: `inset 0 0 0 2px ${selectedBorder}` } : {}),
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
                            <span style={{ color: 'hsl(215 10% 50%)', fontSize: '10px' }}> ({meal.dietaryTags.join(',')})</span>
                          )}
                        </p>
                        {isInCart(meal.id) && (
                          <div className="absolute -top-2 -left-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs text-white shadow-lg z-10">
                            ✓
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  {mealIndex < DAYS.length - 1 && (
                    <td className="border border-slate-200 bg-slate-100 p-0"></td>
                  )}
                </React.Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
        <strong>LSF</strong>=低脂肪 &lt;1.5g/100g · <strong>DBF</strong>=适合糖尿病患者 &lt;15g糖/100g · <strong>LS</strong>=低钠 &lt;150mg/100g · <strong>GF</strong>=无麸质 · <strong>DF</strong>=无乳制品
      </div>
    </div>
  )
}
