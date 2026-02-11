import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Plus, Edit2, Trash2, Star, ChefHat, History, ShoppingCart } from "lucide-react";

const CATEGORIES = ["中餐", "西餐", "日韩料理", "小吃", "甜品", "饮品", "其他"];

export default function MenuBoard() {
  const [activeTab, setActiveTab] = useState<"my" | "partner">("my");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: myItems = [] } = trpc.menu.listItems.useQuery();
  const { data: partnerItems = [] } = trpc.menu.getPartnerItems.useQuery();
  const { data: orderHistory = [] } = trpc.menu.listOrders.useQuery();

  const createItem = trpc.menu.createItem.useMutation({
    onSuccess: () => {
      utils.menu.listItems.invalidate();
      setShowAddDialog(false);
      setEditingItem(null);
    },
  });

  const updateItem = trpc.menu.updateItem.useMutation({
    onSuccess: () => {
      utils.menu.listItems.invalidate();
      setShowAddDialog(false);
      setEditingItem(null);
    },
  });

  const deleteItem = trpc.menu.deleteItem.useMutation({
    onSuccess: () => {
      utils.menu.listItems.invalidate();
    },
  });

  const createOrder = trpc.menu.createOrder.useMutation({
    onSuccess: () => {
      utils.menu.listOrders.invalidate();
      setShowOrderDialog(false);
      setSelectedItems([]);
    },
  });

  const currentItems = activeTab === "my" ? myItems : partnerItems;

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as string || undefined,
      rating: parseInt(formData.get("rating") as string) || 3,
      notes: formData.get("notes") as string || undefined,
    };

    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, ...data });
    } else {
      createItem.mutate(data);
    }
  };

  const handleOrder = () => {
    if (selectedItems.length === 0) return;
    createOrder.mutate({
      menuItemIds: selectedItems,
      orderDate: new Date().toISOString(),
      notes: `点了${selectedItems.length}道菜`,
    });
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <ChefHat className="w-10 h-10 text-orange-500" />
            🍽️ 今天吃什么？
          </h1>
          <p className="text-gray-600">双人菜单，解决选择困难症</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4 mb-6">
          {activeTab === "my" && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddDialog(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加菜品
            </button>
          )}
          {selectedItems.length > 0 && (
            <button
              onClick={handleOrder}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              点这{selectedItems.length}道菜
            </button>
          )}
          <button
            onClick={() => setShowHistoryDialog(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            点菜历史
          </button>
        </div>

        {/* 双菜单切换 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab("my")}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
              activeTab === "my"
                ? "bg-white shadow-lg text-orange-600 scale-105"
                : "bg-white/50 text-gray-600 hover:bg-white/70"
            }`}
          >
            📖 我的菜单
          </button>
          <button
            onClick={() => setActiveTab("partner")}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
              activeTab === "partner"
                ? "bg-white shadow-lg text-orange-600 scale-105"
                : "bg-white/50 text-gray-600 hover:bg-white/70"
            }`}
          >
            📖 TA的菜单
          </button>
        </div>

        {/* 菜品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item: any) => (
            <div
              key={item.id}
              onClick={() => toggleSelectItem(item.id)}
              className={`bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition cursor-pointer ${
                selectedItems.includes(item.id) ? "ring-4 ring-orange-400" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
                {activeTab === "my" && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(item);
                        setShowAddDialog(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("确定删除这道菜吗？")) {
                          deleteItem.mutate({ id: item.id });
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {item.category && (
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm mb-3">
                  {item.category}
                </span>
              )}

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (item.rating || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {item.notes && (
                <p className="text-gray-600 text-sm">{item.notes}</p>
              )}

              {selectedItems.includes(item.id) && (
                <div className="mt-3 text-center text-orange-600 font-semibold">
                  ✓ 已选择
                </div>
              )}
            </div>
          ))}
        </div>

        {currentItems.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <ChefHat className="w-20 h-20 mx-auto mb-4 opacity-50" />
            <p className="text-xl">还没有菜品，快来添加吧！</p>
          </div>
        )}
      </div>

      {/* 添加/编辑菜品对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingItem ? "编辑菜品" : "添加菜品"}
            </h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  菜品名称 *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingItem?.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="例如：红烧牛肉面"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  name="category"
                  defaultValue={editingItem?.category || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">不分类</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  喜爱程度
                </label>
                <input
                  type="number"
                  name="rating"
                  min="1"
                  max="5"
                  defaultValue={editingItem?.rating || 3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingItem?.notes || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="口味偏好、辣度等"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 点菜历史对话框 */}
      {showHistoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">点菜历史</h2>
              <button
                onClick={() => setShowHistoryDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {orderHistory.map((order: any) => (
                <div key={order.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-600">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                    {order.completed && (
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                        已完成
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800">{order.notes}</p>
                </div>
              ))}

              {orderHistory.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  还没有点菜记录
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
