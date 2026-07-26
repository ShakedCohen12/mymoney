// להוסיף בראש עמוד הוספת התנועה:
import AddCategoryModal, {
  CreatedCategory,
} from "@/components/categories/AddCategoryModal";

// טיפוס הקטגוריה במסך צריך לכלול:
type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string | null;
  color: string | null;
  user_id?: string | null;
};

// במקום const categories הקשיח, בתוך הקומפוננטה:
const [categories, setCategories] = useState<Category[]>([]);
const [showAddCategory, setShowAddCategory] = useState(false);

// לטעון את הקטגוריות אחרי קבלת המשתמש:
const { data: categoryData, error: categoryError } = await supabase
  .from("categories")
  .select("id, name, type, icon, color, user_id")
  .or(`user_id.is.null,user_id.eq.${user.id}`)
  .order("name");

if (categoryError) throw new Error("לא הצלחנו לטעון את הקטגוריות.");
setCategories((categoryData as Category[] | null) ?? []);

// להוסיף ליד רשימת הקטגוריות:
<button
  type="button"
  onClick={() => setShowAddCategory(true)}
  className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 px-4 py-3 font-bold text-violet-700"
>
  ＋ קטגוריה חדשה
</button>

// להוסיף בסוף ה-JSX של העמוד:
<AddCategoryModal
  open={showAddCategory}
  initialType={type}
  onClose={() => setShowAddCategory(false)}
  onCreated={(category: CreatedCategory) => {
    setCategories((current) => [...current, category]);
    setCategoryId(category.id);
    setShowAddCategory(false);
  }}
/>

// בשמירת התנועה אין צורך לחפש קטגוריה לפי שם או slug.
// categoryId הוא כבר ה-UUID האמיתי מה-Supabase:
const databaseCategoryId = categoryId;

// וב-insert של transaction:
// category_id: databaseCategoryId
