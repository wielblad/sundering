import { useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { ITEMS, ITEM_IDS, Item } from '@sundering/shared';
import { playBuyItemSound, playSellItemSound, playErrorSound } from '../../services/audio';
import { ITEM_LORE } from '../../constants/loreData';

// Get tier styling based on item category
function getTierStyles(category: string) {
  switch (category) {
    case 'basic':
      return {
        border: 'border-slate-500',
        bg: 'bg-slate-700',
        text: 'text-slate-300',
        glow: '',
        badge: 'bg-slate-600 text-slate-300',
      };
    case 'advanced':
      return {
        border: 'border-blue-500',
        bg: 'bg-blue-900/50',
        text: 'text-blue-300',
        glow: 'shadow-blue-500/20 shadow-lg',
        badge: 'bg-blue-600 text-blue-100',
      };
    case 'legendary':
      return {
        border: 'border-human-500',
        bg: 'bg-human-900/30',
        text: 'text-human-300',
        glow: 'shadow-human-500/30 shadow-lg ring-1 ring-human-500/20',
        badge: 'bg-gradient-to-r from-human-600 to-yellow-500 text-human-100',
      };
    default:
      return {
        border: 'border-slate-500',
        bg: 'bg-slate-700',
        text: 'text-slate-300',
        glow: '',
        badge: 'bg-slate-600 text-slate-300',
      };
  }
}

// Item Card Component with enhanced styling
interface ItemCardProps {
  item: Item;
  canAfford: boolean;
  isSelected: boolean;
  onClick: () => void;
  onSelect: () => void;
}

function ItemCard({ item, canAfford, isSelected, onClick, onSelect }: ItemCardProps) {
  const styles = getTierStyles(item.category);
  const itemLore = ITEM_LORE[item.id];

  return (
    <button
      onClick={() => {
        onSelect();
        if (canAfford) onClick();
      }}
      disabled={!canAfford}
      className={`
        p-3 rounded-lg border-2 transition-all text-left relative group
        ${styles.border} ${styles.glow}
        ${isSelected ? 'ring-2 ring-white/30' : ''}
        ${canAfford ? 'bg-slate-800/80 hover:bg-slate-700/80 cursor-pointer' : 'bg-slate-900/50 opacity-50 cursor-not-allowed'}
      `}
    >
      {/* Legendary item special background effect */}
      {item.category === 'legendary' && (
        <div className="absolute inset-0 bg-gradient-to-br from-human-500/5 to-transparent rounded-lg" />
      )}

      <div className="relative flex items-start gap-3">
        {/* Item Icon */}
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
            ${styles.bg} ${styles.text}
            ${item.category === 'legendary' ? 'ring-1 ring-human-400/30' : ''}
          `}
        >
          {item.name.charAt(0)}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm font-medium truncate ${styles.text}`}>{item.name}</p>
            {item.category === 'legendary' && (
              <span className="text-human-400 text-xs">*</span>
            )}
          </div>

          {/* True Name for Legendary Items */}
          {itemLore?.trueName && item.category === 'legendary' && (
            <p className="text-xs text-human-400/70 italic truncate mb-1">
              "{itemLore.trueName}"
            </p>
          )}

          <p className="text-xs text-human-400 font-medium">{item.cost}g</p>
        </div>
      </div>

      {/* Tier Badge */}
      <span
        className={`
          absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-medium uppercase rounded
          ${styles.badge}
        `}
      >
        {item.category.charAt(0)}
      </span>
    </button>
  );
}

// Item Detail Panel with Lore
function ItemDetailPanel({
  item,
  onBuy,
  canAfford,
}: {
  item: Item | null;
  onBuy: () => void;
  canAfford: boolean;
}) {
  if (!item) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm">
        Select an item to view details
      </div>
    );
  }

  const styles = getTierStyles(item.category);
  const itemLore = ITEM_LORE[item.id];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`
              w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold
              ${styles.bg} ${styles.text}
              ${item.category === 'legendary' ? 'ring-2 ring-human-400/30 shadow-lg shadow-human-500/20' : ''}
            `}
          >
            {item.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${styles.text}`}>{item.name}</h3>
            {itemLore?.trueName && (
              <p
                className={`text-sm italic ${item.category === 'legendary' ? 'text-human-400/80' : 'text-slate-400'}`}
              >
                "{itemLore.trueName}"
              </p>
            )}
          </div>
        </div>

        {/* Category Badge */}
        <span
          className={`
            inline-block px-2 py-1 text-xs font-medium uppercase rounded
            ${styles.badge}
          `}
        >
          {item.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-300 text-sm mb-4">{item.description}</p>

      {/* Stats */}
      {Object.keys(item.stats).length > 0 && (
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">Stats</h4>
          <div className="space-y-1">
            {item.stats.health && (
              <p className="text-sm text-green-400">+{item.stats.health} Health</p>
            )}
            {item.stats.mana && (
              <p className="text-sm text-blue-400">+{item.stats.mana} Mana</p>
            )}
            {item.stats.attackDamage && (
              <p className="text-sm text-red-400">+{item.stats.attackDamage} Attack Damage</p>
            )}
            {item.stats.abilityPower && (
              <p className="text-sm text-mystical-400">+{item.stats.abilityPower} Ability Power</p>
            )}
            {item.stats.armor && (
              <p className="text-sm text-human-400">+{item.stats.armor} Armor</p>
            )}
            {item.stats.magicResist && (
              <p className="text-sm text-cyan-400">+{item.stats.magicResist} Magic Resist</p>
            )}
            {item.stats.attackSpeed && (
              <p className="text-sm text-orange-400">
                +{Math.round(item.stats.attackSpeed * 100)}% Attack Speed
              </p>
            )}
            {item.stats.moveSpeed && (
              <p className="text-sm text-teal-400">+{item.stats.moveSpeed} Move Speed</p>
            )}
            {item.stats.lifesteal && (
              <p className="text-sm text-rose-400">
                +{Math.round(item.stats.lifesteal * 100)}% Lifesteal
              </p>
            )}
          </div>
        </div>
      )}

      {/* Passive */}
      {item.passive && (
        <div className="mb-4 p-3 bg-mystical-900/20 rounded-lg border border-mystical-500/30">
          <h4 className="text-xs uppercase tracking-wider text-mystical-400 mb-1">Passive</h4>
          <p className="text-sm text-slate-300">{item.passive}</p>
        </div>
      )}

      {/* Lore Section - Only for items with lore */}
      {itemLore && (
        <div className="flex-1 overflow-y-auto">
          {/* History */}
          <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">History</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{itemLore.history}</p>
          </div>

          {/* Whisper - Special quote for the item */}
          {itemLore.whisper && (
            <div
              className={`
                mb-4 p-3 rounded-lg border
                ${item.category === 'legendary' ? 'bg-human-900/10 border-human-500/20' : 'bg-slate-800/30 border-slate-700/30'}
              `}
            >
              <h4
                className={`text-xs uppercase tracking-wider mb-1 ${item.category === 'legendary' ? 'text-human-400' : 'text-slate-500'}`}
              >
                Whisper
              </h4>
              <p
                className={`text-xs italic leading-relaxed ${item.category === 'legendary' ? 'text-human-300/80' : 'text-slate-400'}`}
              >
                "{itemLore.whisper}"
              </p>
            </div>
          )}

          {/* Previous Owners - For legendary items */}
          {itemLore.previousOwners && itemLore.previousOwners.length > 0 && (
            <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                Previous Owners
              </h4>
              <ul className="space-y-1">
                {itemLore.previousOwners.slice(0, 3).map((owner, idx) => (
                  <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-slate-600">-</span>
                    {owner}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Narrative Effect */}
          {itemLore.narrativeEffect && (
            <div className="mb-4 p-3 bg-mystical-900/10 rounded-lg border border-mystical-500/20">
              <h4 className="text-xs uppercase tracking-wider text-mystical-400 mb-1">
                Bearer's Burden
              </h4>
              <p className="text-xs text-slate-400 italic">{itemLore.narrativeEffect}</p>
            </div>
          )}
        </div>
      )}

      {/* Buy Button */}
      <div className="mt-auto pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-human-400 font-bold">{item.cost} Gold</span>
          <span className="text-xs text-slate-500">Sell: {item.sellValue}g</span>
        </div>
        <button
          onClick={onBuy}
          disabled={!canAfford}
          className={`
            w-full py-2 rounded-lg font-medium transition-all
            ${
              canAfford
                ? 'bg-gradient-to-r from-human-600 to-human-500 hover:from-human-500 hover:to-human-400 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {canAfford ? 'Purchase' : 'Not Enough Gold'}
        </button>
      </div>
    </div>
  );
}

interface ItemShopProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemShop({ isOpen, onClose }: ItemShopProps) {
  const { players, buyItem, sellItem } = useGameStore();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'basic' | 'advanced' | 'legendary' | 'consumable'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const myPlayer = useMemo(() => {
    return Array.from(players.values()).find((p) => p.userId === user?.id);
  }, [players, user]);

  const filteredItems = useMemo(() => {
    const itemIds = activeCategory === 'all' ? ITEM_IDS.all : ITEM_IDS[activeCategory] || [];

    return itemIds
      .map((id) => ITEMS[id])
      .filter((item) => item)
      .filter(
        (item) =>
          searchTerm === '' ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [activeCategory, searchTerm]);

  const handleBuyItem = useCallback(
    (itemId: string) => {
      const item = ITEMS[itemId];
      if (item && myPlayer && myPlayer.gold >= item.cost) {
        playBuyItemSound();
        buyItem(itemId);
      } else {
        playErrorSound();
      }
    },
    [buyItem, myPlayer]
  );

  const handleSellItem = useCallback(
    (slot: number) => {
      playSellItemSound();
      sellItem(slot);
    },
    [sellItem]
  );

  if (!isOpen) return null;

  const gold = myPlayer?.gold || 0;

  // Category counts
  const categoryCounts = {
    all: ITEM_IDS.all.length,
    basic: ITEM_IDS.basic.length,
    advanced: ITEM_IDS.advanced.length,
    legendary: ITEM_IDS.legendary.length,
    consumable: ITEM_IDS.consumable.length,
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative rounded-xl border border-stone-700/60 w-[900px] max-h-[650px] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(28, 25, 23, 0.98) 0%, rgba(12, 10, 9, 0.99) 100%)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), 0 10px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge background texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'url("/assets/badge.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Header */}
        <div
          className="relative flex items-center justify-between p-4 border-b border-stone-700/50"
          style={{
            background: 'linear-gradient(180deg, rgba(41, 37, 36, 0.6) 0%, rgba(28, 25, 23, 0.4) 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-amber-500/30"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.1) 100%)',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
              }}
            >
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-100 font-display">Item Shop</h2>
              <p className="text-xs text-stone-500">Equip legendary artifacts of power</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/30"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-amber-300 font-bold text-lg">{gold}</span>
            </div>
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-amber-300 text-2xl transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="flex h-[550px]">
          {/* Left side - Shop items */}
          <div className="flex-1 p-4 border-r border-slate-700/50 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 pl-10 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-human-500/50 transition-colors"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 mb-4">
              {(
                ['all', 'basic', 'advanced', 'legendary', 'consumable'] as const
              ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                    ${
                      activeCategory === cat
                        ? cat === 'legendary'
                          ? 'bg-gradient-to-r from-human-600 to-human-500 text-white'
                          : 'bg-slate-600 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                    }
                  `}
                >
                  {cat} ({categoryCounts[cat]})
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  canAfford={gold >= item.cost}
                  isSelected={selectedItem?.id === item.id}
                  onClick={() => handleBuyItem(item.id)}
                  onSelect={() => setSelectedItem(item)}
                />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <p className="text-slate-500 text-center py-8">No items found</p>
            )}
          </div>

          {/* Middle - Item Detail */}
          <div className="w-72 p-4 border-r border-slate-700/50 bg-slate-900/30">
            <ItemDetailPanel
              item={selectedItem}
              onBuy={() => selectedItem && handleBuyItem(selectedItem.id)}
              canAfford={selectedItem ? gold >= selectedItem.cost : false}
            />
          </div>

          {/* Right side - Inventory */}
          <div className="w-56 p-4 bg-slate-900/50">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
              </svg>
              Your Inventory
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((slot) => {
                const invItem = myPlayer?.inventory.find((i) => i.slot === slot);
                const item = invItem ? ITEMS[invItem.itemId] : null;
                const styles = item ? getTierStyles(item.category) : null;

                return (
                  <div
                    key={slot}
                    className={`
                      w-full aspect-square rounded-lg border-2 flex items-center justify-center relative
                      ${item ? `${styles?.border} ${styles?.bg}` : 'border-slate-700/50 bg-slate-900/50'}
                      ${item?.category === 'legendary' ? 'ring-1 ring-human-400/20' : ''}
                    `}
                  >
                    {item ? (
                      <button
                        onClick={() => handleSellItem(slot)}
                        className="w-full h-full flex flex-col items-center justify-center group relative"
                        title={`${item.name}\nSell for ${item.sellValue}g`}
                      >
                        <span className={`text-lg font-bold ${styles?.text}`}>
                          {item.name.charAt(0)}
                        </span>
                        {invItem && invItem.stackCount > 1 && (
                          <span className="absolute bottom-0.5 right-0.5 bg-slate-700 text-white text-[10px] px-1 rounded">
                            {invItem.stackCount}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <span className="text-[10px] text-red-400 font-medium">Sell</span>
                        </div>
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">{slot + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stats from items */}
            {myPlayer && myPlayer.inventory.length > 0 && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Item Stats
                </h4>
                <div className="space-y-1 text-xs">
                  {myPlayer.attackDamage > 0 && (
                    <p className="text-red-400">+{myPlayer.attackDamage} AD</p>
                  )}
                  {myPlayer.armor > 0 && (
                    <p className="text-human-400">+{myPlayer.armor} Armor</p>
                  )}
                  {myPlayer.magicResist > 0 && (
                    <p className="text-cyan-400">+{myPlayer.magicResist} MR</p>
                  )}
                </div>
              </div>
            )}

            {/* Quick buy tip */}
            <div className="mt-4 p-2 bg-slate-800/30 rounded-lg">
              <p className="text-[10px] text-slate-500 text-center">
                Click item to buy - Click inventory to sell
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="relative p-3 border-t border-stone-700/50 text-xs flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, rgba(28, 25, 23, 0.4) 0%, rgba(12, 10, 9, 0.6) 100%)',
          }}
        >
          <span className="text-stone-600">Press B to close</span>
          <span className="italic text-stone-500">
            "Every object has a soul. The mightier the object, the more souls it has consumed."
          </span>
        </div>
      </div>
    </div>
  );
}
