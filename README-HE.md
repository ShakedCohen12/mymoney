# MyMoney — קטגוריה חופשית + תקציבים בניווט התחתון

## 1. הרצת SQL
הריצי ב-Supabase SQL Editor:

`supabase/migrations/20260724_custom_categories.sql`

## 2. העתיקי את הרכיבים

- `components/categories/EmojiPicker.tsx`
- `components/categories/ColorPicker.tsx`
- `components/categories/AddCategoryModal.tsx`
- `components/layout/BottomNavigation.tsx`

## 3. עמוד התקציבים
החליפי את:

`app/budgets/page.tsx`

בקובץ שבחבילה. הוא כולל את הניווט התחתון ואת שדה ההכנסה הידני.

## 4. עמוד הבית
פתחי `HOME-PAGE-PATCH.tsx` והוסיפי את שתי השורות לעמוד הבית הקיים.
כפתור "תקציבים" מפנה אל `/budgets`.

## 5. עמוד הוספת תנועה
פתחי `INTEGRATION-TRANSACTION-PAGE.tsx` והטמיעי את הקטעים בעמוד הקיים.

הגרסה החדשה מאפשרת:
- לכתוב כל שם קטגוריה.
- להקליד או להדביק כל אימוג׳י ממקלדת האימוג׳ים.
- לבחור גם מתוך רשימה מהירה.
- לבחור צבע.
- לשמור את הקטגוריה ב-Supabase ולבחור אותה מיד בתנועה.

## הערת נתיבים
רכיב הניווט מניח את הנתיבים:
- `/home`
- `/transactions`
- `/transactions/new`
- `/budgets`
- `/reports`
- `/profile`

אם אצלך שם תיקייה שונה, עדכני רק את `href` בתוך `BottomNavigation.tsx`.
