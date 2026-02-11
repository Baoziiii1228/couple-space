import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Plus, Edit2, Trash2, Star, ChefHat, History, Dices, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const CATEGORIES = ["中餐", "西餐", "日韩料理", "小吃", "甜品", "饮品", "其他"];

const ZONES = [
  { value: "meat", label: "荤菜", emoji: "🥩", color: "from-red-100 to-orange-100" },
  { value: "vegetable", label: "素菜", emoji: "🥬", color: "from-green-100 to-lime-100" },
  { value: "staple", label: "主食", emoji: "🍜", color: "from-yellow-100 to-amber-100" },
  { value: "soup", label: "汤品", emoji: "🍲", color: "from-blue-100 to-cyan-100" },
  { value: "dessert", label: "甜品", emoji: "🍰", color: "from-pink-100 to-purple-100" },
];

export default function MenuBoard() {
  const [activeTab, setActiveTab] = useState<"my" | "partner">("my");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRandomDialog, setShowRandomDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [randomResult, setRandomResult] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [zone, setZone] = useState("meat");
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: myItems = [] } = trpc.menu.listItems.useQuery();
  const { data: partnerItems = [] } = trpc.menu.getPartnerItems.useQuery();
  const { data: orderHistory = [] } = trpc.menu.listOrders.useQuery();

  const createItem = trpc.menu.createItem.useMutation({
    onSuccess: () => {
      utils.menu.listItems.invalidate();
      setShowAddDialog(false);
      resetForm();
      toast.success("菜品已添加");
    },
  });

  const updateItem = trpc.menu.updateItem.useMutation({
    onSuccess: () => {
      utils.menu.listItems.invalidate();
      setShowAddDialog(false);
      resetForm();
      toast.success("菜品已更新");
    },
  });

  const deleteItem = trpc.menu.deleteItem.useMutation({
    onSuccess: () => {
      utils.menu.listItems.invalidate();
      toast.success("菜品已删除");
    },
  });

  const createOrder = trpc.menu.createOrder.useMutation({
    onSuccess: () => {
      utils.menu.listOrders.invalidate();
      setSelectedItems([]);
      toast.success("点菜成功");
    },
  });

  const currentItems = activeTab === "my" ? myItems : partnerItems;

  const resetForm = () => {
    setName("");
    setCategory("");
    setZone("meat");
    setRating(3);
    setNotes("");
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || "");
    setZone(item.zone || "meat");
    setRating(item.rating || 3);
    setNotes(item.notes || "");
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("请输入菜品名称");
      return;
    }

    if (editingItem) {
      updateItem.mutate({
        id: editingItem.id,
        name,
        category,
        rating,
        notes,
      } as any);
    } else {
      createItem.mutate({ name, category, rating, notes } as any);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这道菜吗？")) {
      deleteItem.mutate({ id });
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOrder = () => {
    if (selectedItems.length === 0) {
      toast.error("请先选择菜品");
      return;
    }
    createOrder.mutate({ menuItemIds: selectedItems, orderDate: new Date().toISOString() });
  };

  // 随机点菜功能
  const handleRandomOrder = () => {
    const allItems = [...myItems, ...partnerItems];
    if (allItems.length === 0) {
      toast.error("菜单为空，请先添加菜品");
      return;
    }

    const result: any = {};
    ZONES.forEach((zone) => {
      const zoneItems = allItems.filter((item: any) => item.zone === zone.value);
      if (zoneItems.length > 0) {
        const randomItem = zoneItems[Math.floor(Math.random() * zoneItems.length)];
        result[zone.value] = randomItem;
      }
    });

    setRandomResult(result);
    setShowRandomDialog(true);
  };

  const confirmRandomOrder = () => {
    const itemIds = Object.values(randomResult).map((item: any) => item.id);
    createOrder.mutate({ menuItemIds: itemIds, orderDate: new Date().toISOString() });
    setShowRandomDialog(false);
    setRandomResult(null);
  };

  // 按分区分组菜品
  const groupedItems = ZONES.reduce((acc, zone) => {
    acc[zone.value] = currentItems.filter((item: any) => item.zone === zone.value);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen gradient-warm-subtle">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/20 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <ChefHat className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">点菜板</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistoryDialog(true)}
              className="px-4 py-2 bg-white/50 dark:bg-white/10 hover:bg-white/70 dark:hover:bg-white/20 rounded-lg transition flex items-center gap-2 text-gray-800 dark:text-white"
            >
              <History className="w-4 h-4" />
              历史
            </button>
            <button
              onClick={handleRandomOrder}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
            >
              <Dices className="w-4 h-4" />
              随机点菜
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab切换 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 py-3 rounded-lg font-medium transition ${
              activeTab === "my"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                : "glass text-gray-600 dark:text-gray-300 hover:bg-white/70 dark:hover:bg-white/20"
            }`}
          >
            我的菜单
          </button>
          <button
            onClick={() => setActiveTab("partner")}
            className={`flex-1 py-3 rounded-lg font-medium transition ${
              activeTab === "partner"
                ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            TA的菜单
          </button>
        </div>

        {/* 添加菜品按钮 */}
        {activeTab === "my" && (
          <button
            onClick={() => {
              resetForm();
              setShowAddDialog(true);
            }}
            className="w-full mb-6 py-4 glass border-2 border-dashed border-orange-300 dark:border-orange-500/50 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 font-medium"
          >
            <Plus className="w-5 h-5" />
            添加菜品
          </button>
        )}

        {/* 分区展示 */}
        <div className="space-y-6">
          {ZONES.map((zone) => {
            const items = groupedItems[zone.value] || [];
            if (items.length === 0) return null;

            return (
              <div key={zone.value} className="glass rounded-xl shadow-sm overflow-hidden">
                <div className={`bg-gradient-to-r ${zone.color} dark:opacity-90 px-6 py-4 flex items-center gap-3`}>
                  <span className="text-3xl">{zone.emoji}</span>
                  <h2 className="text-xl font-bold text-gray-800">{zone.label}</h2>
                  <span className="text-sm text-gray-600">({items.length}道)</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                        selectedItems.includes(item.id)
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50"
                      }`}
                      onClick={() => activeTab === "partner" && toggleSelectItem(item.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">{item.name}</h3>
                        {activeTab === "my" && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                      {item.category && (
                        <span className="inline-block px-2 py-1 bg-white dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 mb-2">
                          {item.category}
                        </span>
                      )}
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      {item.notes && <p className="text-sm text-gray-600 dark:text-gray-400">{item.notes}</p>}
                      {selectedItems.includes(item.id) && (
                        <div className="mt-2 text-blue-600 dark:text-blue-400 font-medium text-sm">✓ 已选择</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {currentItems.length === 0 && (
          <div className="text-center py-12 glass rounded-xl">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === "my" ? "还没有添加菜品，快来添加吧！" : "TA还没有添加菜品"}
            </p>
          </div>
        )}

        {/* 点菜按钮 */}
        {activeTab === "partner" && selectedItems.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <button
              onClick={handleOrder}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition flex items-center gap-2 text-lg font-bold"
            >
              <ChefHat className="w-6 h-6" />
              点这{selectedItems.length}道菜
            </button>
          </div>
        )}
      </main>

      {/* 添加/编辑菜品对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{editingItem ? "编辑菜品" : "添加菜品"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">菜品名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
                  placeholder="例如：红烧肉"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分区 *</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
                >
                  {ZONES.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.emoji} {z.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
                >
                  <option value="">选择分类</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">喜爱程度</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg"
                  rows={3}
                  placeholder="例如：微辣、少糖"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={createItem.isPending || updateItem.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                {editingItem ? "保存" : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 随机点菜结果对话框 */}
      {showRandomDialog && randomResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Dices className="w-6 h-6 text-purple-600" />
              随机点菜结果
            </h2>
            <div className="space-y-3 mb-6">
              {ZONES.map((zone) => {
                const item = randomResult[zone.value];
                if (!item) return null;
                return (
                  <div key={zone.value} className={`p-3 rounded-lg bg-gradient-to-r ${zone.color}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{zone.emoji}</span>
                      <span className="font-medium text-gray-700">{zone.label}：</span>
                    </div>
                    <div className="font-bold text-gray-800 dark:text-gray-900 text-lg">{item.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRandomOrder}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
              >
                <Dices className="w-4 h-4" />
                重新随机
              </button>
              <button
                onClick={confirmRandomOrder}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition"
              >
                就吃这些
              </button>
            </div>
            <button
              onClick={() => {
                setShowRandomDialog(false);
                setRandomResult(null);
              }}
              className="w-full mt-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 点菜历史对话框 */}
      {showHistoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              点菜历史
            </h2>
            {orderHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">还没有点菜记录</div>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order: any) => (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(order.orderDate).toLocaleString("zh-CN")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.menuItemIds?.map((id: number) => {
                        const item = [...myItems, ...partnerItems].find((i: any) => i.id === id);
                        return item ? (
                          <span
                            key={id}
                            className="px-3 py-1 bg-white rounded-full text-sm border"
                          >
                            {item.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowHistoryDialog(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
