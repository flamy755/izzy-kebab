import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import donner from "@/assets/donner.jpg";
import jufka from "@/assets/jufka.jpg";
import donnerbox from "@/assets/donnerbox.jpg";
import burger1 from "@/assets/burger1.jpg";
import burger2 from "@/assets/burger2.jpg";
import pomfri from "@/assets/pomfri.jpg";
import logo from "@/assets/izzy-logo.png";
import dCocaCola05 from "@/assets/drinks/cocacola-05.png";
import dCocaCola033 from "@/assets/drinks/cocacola-033.png";
import dFanta05 from "@/assets/drinks/fanta-05.png";
import dFanta033 from "@/assets/drinks/fanta-033.png";
import dSchweppesTang from "@/assets/drinks/schweppes-tangerina.png";
import dSchweppesBL from "@/assets/drinks/schweppes-bitterlemon.png";
import dPepsi05 from "@/assets/drinks/pepsi-05.png";
import dPepsiCan from "@/assets/drinks/pepsi-can.png";
import dSolaBreskev from "@/assets/drinks/sola-breskev.png";
import dSolaLimonada from "@/assets/drinks/sola-limonada.png";
import dMultiSola from "@/assets/drinks/multi-sola.png";
import dRadenska from "@/assets/drinks/radenska.png";
import dUnionRadler from "@/assets/drinks/union-radler.png";
import dDana from "@/assets/drinks/dana-voda.png";
import dZala from "@/assets/drinks/zala-breskev.png";
import dGoldenEagle from "@/assets/drinks/golden-eagle.png";
import dFuzeTea from "@/assets/drinks/fuze-tea.png";
import dMonster from "@/assets/drinks/monster.png";
import dAyran from "@/assets/drinks/ayran.png";
import { Phone, MapPin, Clock, Star, Flame, Navigation, ShoppingBag, Plus, Minus, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Index });

const PHONE = "070604657";
const PHONE_INTL = "38670604657";
const PHONE_DISPLAY = "070 604 657";
const MAPS = "https://www.google.com/maps/dir/?api=1&destination=Rej%C4%8Deva+ulica+3,+5000+Nova+Gorica";
const ADDRESS = "Rejčeva ulica 3, 5000 Nova Gorica";

// Opening hours: 0=Sunday ... 6=Saturday. End in minutes from midnight; >1440 means past midnight.
const HOURS: Record<number, { open: number; close: number; label: string }> = {
  1: { open: 10 * 60, close: 24 * 60, label: "10:00 – 00:00" }, // Mon
  2: { open: 10 * 60, close: 24 * 60, label: "10:00 – 00:00" },
  3: { open: 10 * 60, close: 24 * 60, label: "10:00 – 00:00" },
  4: { open: 10 * 60, close: 24 * 60, label: "10:00 – 00:00" },
  5: { open: 10 * 60, close: 26 * 60, label: "10:00 – 02:00" }, // Fri
  6: { open: 10 * 60, close: 26 * 60, label: "10:00 – 02:00" }, // Sat
  0: { open: 10 * 60, close: 24 * 60, label: "10:00 – 00:00" }, // Sun
};

function useOpenStatus() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return { openNow: false, ready: false };
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = HOURS[day];
  const yesterday = HOURS[(day + 6) % 7];
  // open if today's range covers now, OR yesterday's late-night range extends past midnight
  const openNow =
    (mins >= today.open && mins < today.close) ||
    (yesterday.close > 24 * 60 && mins < yesterday.close - 24 * 60);
  return { openNow, ready: true };
}

type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  img: string;
  tag: string;
  customizable?: boolean;
  vege?: boolean;
  customType?: "full" | "burger" | "pomfri";
};

const menu: MenuItem[] = [
  { id: "kebab", name: "Kebab", desc: "Sočno meso, sveža zelenjava in hišna omaka.", price: 5.0, img: donner, tag: "Najbolj priljubljeno", customizable: true },
  { id: "vege-kebab", name: "Vege kebab", desc: "Brezmesna različica s svežo zelenjavo in omakami.", price: 3.0, img: donner, tag: "Vege", customizable: true, vege: true },
  { id: "mala-jufka", name: "Mala jufka", desc: "Manjša mehka lepinja s sočnim mesom.", price: 5.0, img: jufka, tag: "Manjša porcija", customizable: true },
  { id: "velika-jufka", name: "Velika jufka", desc: "Tanka mehka lepinja, polnjena s kebab mesom.", price: 6.0, img: jufka, tag: "Lokalna izbira", customizable: true },
  { id: "vege-jufka", name: "Vege jufka", desc: "Mehka jufka s svežo zelenjavo in omakami.", price: 4.0, img: jufka, tag: "Vege", customizable: true, vege: true },
  { id: "donner-box", name: "Döner Box", desc: "Kebab meso, pomfri, zelenjava in omake — vse v eni škatli.", price: 5.0, img: donnerbox, tag: "Vse v enem", customizable: true },
  { id: "hamburger", name: "Hamburger", desc: "Sočen goveji burger, hrustljava solata, svež paradižnik.", price: 5.0, img: burger1, tag: "Klasika", customizable: true, customType: "burger" },
  { id: "cheeseburger", name: "Cheeseburger", desc: "Goveji burger s topljenim sirom in svežo zelenjavo.", price: 5.2, img: burger1, tag: "S sirom", customizable: true, customType: "burger" },
  { id: "dvojni-hamburger", name: "Dvojni hamburger", desc: "Dva sočna goveja burgerja za pravo lakoto.", price: 6.0, img: burger2, tag: "Dvojna porcija", customizable: true, customType: "burger" },
  { id: "dvojni-cheeseburger", name: "Dvojni cheeseburger", desc: "Dva burgerja, dvojni topljen sir.", price: 6.2, img: burger2, tag: "Dvojna porcija", customizable: true, customType: "burger" },
  { id: "pomfri", name: "Porcija pomfrija", desc: "Hrustljav zlat pomfri. Izberi omako.", price: 2.5, img: pomfri, tag: "Priloga", customizable: true, customType: "pomfri" },
];

const drinks = [
  { id: "coca-05", name: "Coca-Cola 0,5 L", price: 2.0, img: dCocaCola05 },
  { id: "coca-033", name: "Coca-Cola 0,33 L", price: 1.5, img: dCocaCola033 },
  { id: "fanta-05", name: "Fanta 0,5 L", price: 2.0, img: dFanta05 },
  { id: "fanta-033", name: "Fanta 0,33 L", price: 1.5, img: dFanta033 },
  { id: "schw-tang", name: "Schweppes Tangerina 0,5 L", price: 2.0, img: dSchweppesTang },
  { id: "schw-bl", name: "Schweppes Bitter Lemon 0,5 L", price: 2.0, img: dSchweppesBL },
  { id: "pepsi-05", name: "Pepsi 0,5 L", price: 2.0, img: dPepsi05 },
  { id: "pepsi-033", name: "Pepsi 0,33 L", price: 1.5, img: dPepsiCan },
  { id: "sola-bres", name: "Sola Čaj Breskev 0,5 L", price: 1.8, img: dSolaBreskev },
  { id: "sola-lim", name: "Sola Limona 0,5 L", price: 1.8, img: dSolaLimonada },
  { id: "multi-sola", name: "Multi Sola 0,5 L", price: 1.8, img: dMultiSola },
  { id: "radenska", name: "Radenska 0,5 L", price: 1.5, img: dRadenska },
  { id: "radler", name: "Union Radler 0,5 L", price: 2.0, img: dUnionRadler },
  { id: "voda", name: "Voda navadna 0,5 L", price: 1.5, img: dDana },
  { id: "voda-okus", name: "Voda z okusom 0,5 L", price: 1.5, img: dZala },
  { id: "golden", name: "Golden Eagle 0,25 L", price: 2.0, img: dGoldenEagle },
  { id: "fuze", name: "Fuze Tea 0,5 L", price: 1.8, img: dFuzeTea },
  { id: "monster", name: "Monster 0,5 L", price: 2.5, img: dMonster },
  { id: "ajran", name: "Ajran", price: 1.5, img: dAyran },
];

const MEAT = ["Piščanec", "Govedina", "Mešano"];
const SAUCES = ["Navadna omaka", "Pekoča omaka"];
const TOPPINGS = ["Čebula", "Zelje", "Solata", "Paradižnik", "Kumarice"];
const EXTRAS = ["Kečap", "Majoneza", "Ajvar", "Načo omaka"];

type Options = { meat?: string; sauces: string[]; toppings: string[]; extras: string[] };
type CartLine = { uid: string; itemId: string; name: string; price: number; qty: number; options?: Options; img: string };

const fmt = (n: number) => `€${n.toFixed(2).replace(".", ",")}`;
const DELIVERY_FEE = 1.0;
const MIN_ORDER = 7.0;
const DELIVERY_CITIES = ["Nova Gorica", "Solkan"] as const;
type DeliveryCity = (typeof DELIVERY_CITIES)[number];

function Index() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [confirmation, setConfirmation] = useState<{ orderId: string; eta: number } | null>(null);
  const { openNow } = useOpenStatus();

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const count = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const addSimple = (m: MenuItem) => {
    setCart((c) => {
      const i = c.findIndex((l) => l.itemId === m.id && !l.options);
      if (i >= 0) {
        const next = [...c]; next[i] = { ...next[i], qty: next[i].qty + 1 }; return next;
      }
      return [...c, { uid: crypto.randomUUID(), itemId: m.id, name: m.name, price: m.price, qty: 1, img: m.img }];
    });
    toast.success(`${m.name} dodano v košarico`);
  };

  const addCustom = (m: MenuItem, opts: Options, qty: number) => {
    setCart((c) => [...c, { uid: crypto.randomUUID(), itemId: m.id, name: m.name, price: m.price, qty, img: m.img, options: opts }]);
    toast.success(`${qty}× ${m.name} dodano v košarico`);
  };

  const updateQty = (uid: string, delta: number) => {
    setCart((c) => c.flatMap((l) => {
      if (l.uid !== uid) return [l];
      const q = l.qty + delta; return q <= 0 ? [] : [{ ...l, qty: q }];
    }));
  };
  const removeLine = (uid: string) => setCart((c) => c.filter((l) => l.uid !== uid));

  return (
    <div className="min-h-screen pb-28 md:pb-0">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2"><Flame className="w-4 h-4" /> Dostava Nova Gorica · ~15 min · 1,00 €</div>
          <a href={`tel:${PHONE}`} className="font-semibold hover:underline">📞 {PHONE_DISPLAY}</a>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-2 py-2 flex items-center gap-2">
          <a href="#top" className="flex-1 min-w-0 flex items-center">
            <img src={logo} alt="Izzy Kebab & Burgers logo" className="w-full h-16 md:h-24 object-contain object-left" />
          </a>
          <div className="flex items-center gap-2 shrink-0">
            <a href={`tel:${PHONE}`} className="hidden sm:inline-flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full font-semibold hover:border-primary transition">
              <Phone className="w-4 h-4" /> Pokliči
            </a>
            <button onClick={() => setCartOpen(true)} className="relative inline-flex items-center gap-2 bg-gradient-flame text-primary-foreground px-4 py-2.5 rounded-full font-semibold shadow-flame hover:scale-105 transition">
              <ShoppingBag className="w-4 h-4" /> Košarica
              {count > 0 && <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-ember)]" />
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center relative">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-1.5 text-sm mb-6">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              <span className="font-semibold">4.7</span>
              <span className="text-muted-foreground">· Sveže pripravljeno</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6">
              Naroči <span className="text-gradient-flame">döner</span><br />v eni minuti.
            </h1>
            <p className="text-muted-foreground text-lg mb-6 max-w-md">Sestavi svoj kebab, jufko ali burger. Dostava v Novi Gorici v ~15 minutah (1,00 €).</p>
            <div className="flex flex-wrap gap-3">
              <a href="#menu" className="inline-flex items-center gap-2 bg-gradient-flame text-primary-foreground px-7 py-4 rounded-full font-bold text-lg shadow-flame hover:scale-105 transition">
                <ShoppingBag className="w-5 h-5" /> Začni naročilo
              </a>
              <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 border-2 border-border bg-card px-7 py-4 rounded-full font-bold text-lg hover:border-primary transition">
                <Phone className="w-5 h-5" /> Pokliči
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Rejčeva 3</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Pon–Čet & Ned 10–00 · Pet–Sob 10–02</div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-xs ${openNow ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40" : "bg-red-500/15 text-red-400 border border-red-500/40"}`}>
                <span className={`w-2 h-2 rounded-full ${openNow ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {openNow ? "ODPRTO" : "ZAPRTO"}
              </div>
              <div className="flex items-center gap-2"><Flame className="w-4 h-4 text-primary" /> Halal</div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-primary font-semibold tracking-widest text-sm">MENU</div>
          <h2 className="font-display text-5xl md:text-6xl mt-2">Pečeno. <span className="text-gradient-flame">Sveže.</span></h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menu.map((item) => (
            <article key={item.id} className="group bg-card border border-border rounded-3xl overflow-hidden hover:border-primary transition shadow-card-soft flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.img} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                <div className="absolute top-4 left-4 bg-gradient-flame text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">{item.tag}</div>
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur font-display text-2xl px-3 py-1 rounded-full">{fmt(item.price)}</div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display text-2xl mb-2">{item.name}</h3>
                <p className="text-muted-foreground text-sm flex-1">{item.desc}</p>
                <button
                  onClick={() => item.customizable ? setEditing(item) : addSimple(item)}
                  className="mt-5 inline-flex items-center justify-center gap-2 bg-gradient-flame text-primary-foreground px-5 py-3 rounded-full font-bold shadow-flame hover:scale-[1.02] transition"
                >
                  <Plus className="w-4 h-4" /> {item.customizable ? "Sestavi & dodaj" : "Dodaj v košarico"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Drinks */}
      <section id="drinks" className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="text-primary font-semibold tracking-widest text-sm">PIJAČE</div>
          <h2 className="font-display text-5xl md:text-6xl mt-2">Hladno. <span className="text-gradient-flame">Osvežilno.</span></h2>
        </div>
        <div className="bg-card border border-border rounded-3xl p-4 md:p-6 shadow-card-soft max-w-4xl mx-auto">
          <ul className="divide-y divide-border">
            {drinks.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-xl bg-drink-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                    <img src={d.img} alt={d.name} loading="lazy" className="max-w-full max-h-full object-contain p-1" />
                  </div>
                  <span className="font-medium text-foreground/90 truncate">{d.name}</span>
                </div>
                <span className="font-display text-xl text-gradient-flame whitespace-nowrap">{fmt(d.price)}</span>
                <button
                  onClick={() => addSimple({ id: d.id, name: d.name, price: d.price, img: d.img, desc: "", tag: "" })}
                  className="ml-1 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-flame text-primary-foreground shadow-flame hover:scale-110 transition shrink-0"
                  aria-label={`Dodaj ${d.name}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Visit */}
      <section id="visit" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-flame opacity-95" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center text-primary-foreground">
          <h2 className="font-display text-5xl md:text-7xl mb-6">Pot do nas</h2>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-2 bg-charcoal text-cream px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition">
              <Phone className="w-5 h-5" /> {PHONE_DISPLAY}
            </a>
            <a href={MAPS} target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-cream text-charcoal px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition">
              <Navigation className="w-5 h-5" /> Odpri zemljevid
            </a>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-charcoal/30 backdrop-blur rounded-2xl p-5">
              <MapPin className="w-6 h-6 mb-2" />
              <div className="font-bold">Naslov</div>
              <div className="text-sm opacity-90">{ADDRESS}</div>
            </div>
            <div className="bg-charcoal/30 backdrop-blur rounded-2xl p-5">
              <Clock className="w-6 h-6 mb-2" />
              <div className="flex items-center gap-2 mb-1">
                <div className="font-bold">Odpiralni čas</div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${openNow ? "bg-emerald-500 text-white" : "bg-red-600 text-white"}`}>
                  {openNow ? "ODPRTO" : "ZAPRTO"}
                </span>
              </div>
              <div className="text-sm opacity-90 leading-relaxed">
                Pon–Čet: 10:00 – 00:00<br />
                Pet–Sob: 10:00 – 02:00<br />
                Ned: 10:00 – 00:00
              </div>
            </div>
            <div className="bg-charcoal/30 backdrop-blur rounded-2xl p-5">
              <Navigation className="w-6 h-6 mb-2" />
              <div className="font-bold">Dostava</div>
              <div className="text-sm opacity-90">Samo Nova Gorica · ~15 min · 1,00 €</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-charcoal border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <div className="font-display text-xl text-cream">IZZI DONNER KEBAB</div>
            <div>Izair Džaferi s.p. · Gostinske storitve</div>
          </div>
          <div>© {new Date().getFullYear()} · Nova Gorica</div>
        </div>
      </footer>

      {/* Mobile sticky cart bar */}
      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
        <button
          onClick={() => setCartOpen(true)}
          className="w-full bg-gradient-flame text-primary-foreground py-3.5 px-5 rounded-full font-bold shadow-flame flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span>{count > 0 ? `Košarica · ${count}` : "Košarica"}</span>
          </span>
          <span>{count > 0 ? `${fmt(total)} →` : "Začni"}</span>
        </button>
      </div>

      {/* Customize dialog */}
      <CustomizeDialog item={editing} onClose={() => setEditing(null)} onAdd={addCustom} />

      {/* Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="font-display text-3xl">Tvoja košarica</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Košarica je prazna.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.map((l) => (
                  <li key={l.uid} className="bg-muted/40 rounded-2xl p-3 flex gap-3">
                    <img src={l.img} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold truncate">{l.name}</div>
                        <button onClick={() => removeLine(l.uid)} className="text-muted-foreground hover:text-destructive shrink-0"><X className="w-4 h-4" /></button>
                      </div>
                      {l.options && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {l.options.meat && <div>Meso: {l.options.meat}</div>}
                          {l.options.sauces.length > 0 && <div>Omake: {l.options.sauces.join(", ")}</div>}
                          {l.options.toppings.length > 0 && <div>Priloge: {l.options.toppings.join(", ")}</div>}
                          {l.options.extras.length > 0 && <div>Dodatki: {l.options.extras.join(", ")}</div>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(l.uid, -1)} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary"><Minus className="w-3 h-3" /></button>
                          <span className="font-semibold w-6 text-center">{l.qty}</span>
                          <button onClick={() => updateQty(l.uid, 1)} className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="font-display text-lg text-gradient-flame">{fmt(l.price * l.qty)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t border-border p-6 space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Skupaj</span>
                <span className="font-display text-2xl text-gradient-flame">{fmt(total)}</span>
              </div>
              <Button onClick={() => { setCartOpen(false); setCheckout(true); }} className="w-full bg-gradient-flame text-primary-foreground font-bold py-6 rounded-full shadow-flame text-base hover:scale-[1.01]">
                Nadaljuj na naročilo →
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout sheet */}
      <CheckoutSheet
        open={checkout}
        onOpenChange={setCheckout}
        cart={cart}
        total={total}
        onSuccess={(orderId) => {
          setCart([]);
          setCheckout(false);
          setConfirmation({ orderId, eta: 30 });
        }}
      />

      {/* Order confirmation modal */}
      <OrderConfirmation
        data={confirmation}
        onClose={() => setConfirmation(null)}
      />
    </div>
  );
}

function OrderConfirmation({ data, onClose }: { data: { orderId: string; eta: number } | null; onClose: () => void }) {
  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div className="relative bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
          {/* Decorative top */}
          <div className="relative h-32 bg-gradient-flame flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_30%,#fff_0%,transparent_50%)]" />
            <div className="relative w-20 h-20 rounded-full bg-white/95 flex items-center justify-center shadow-xl animate-scale-in">
              <Check className="w-10 h-10 text-emerald-500 stroke-[3]" strokeLinecap="round" />
            </div>
          </div>
          <div className="p-6 text-center">
            <DialogHeader className="space-y-2">
              <DialogTitle className="font-display text-3xl text-center">
                Naročilo sprejeto <span className="inline-block">✅</span>
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground mt-2">
              Hvala za naročilo pri <span className="font-semibold text-foreground">Izzy Döner</span>.
            </p>

            <div className="mt-5 mx-auto inline-flex items-center gap-3 bg-gradient-flame text-primary-foreground px-5 py-3 rounded-2xl shadow-flame">
              <Clock className="w-5 h-5" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-widest opacity-80">Predviden čas dostave</div>
                <div className="font-display text-2xl leading-none mt-0.5">približno {data?.eta ?? 30} minut</div>
              </div>
            </div>

            {data?.orderId && (
              <div className="mt-4 text-xs text-muted-foreground">
                Številka naročila: <span className="font-mono">#{data.orderId.slice(0, 8).toUpperCase()}</span>
              </div>
            )}

            <Button
              onClick={onClose}
              className="w-full mt-6 bg-foreground text-background hover:bg-foreground/90 font-bold py-6 rounded-full"
            >
              V redu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomizeDialog({ item, onClose, onAdd }: { item: MenuItem | null; onClose: () => void; onAdd: (m: MenuItem, o: Options, q: number) => void }) {
  const [meat, setMeat] = useState<string | undefined>();
  const [sauces, setSauces] = useState<string[]>([]);
  const [toppings, setToppings] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  // reset on open
  const open = !!item;
  useEffect(() => {
    if (item) { setMeat(undefined); setSauces([]); setToppings([]); setExtras([]); setQty(1); }
  }, [item?.id]);

  if (!item) return null;
  const ctype = item.customType ?? "full";
  const needsMeat = ctype === "full" && !item.vege;
  const showSaucesToppings = ctype !== "pomfri";
  const isPomfri = ctype === "pomfri";
  const canAdd = needsMeat ? !!meat : isPomfri ? extras.length > 0 : true;

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = () => {
    onAdd(item, { meat: needsMeat ? meat : undefined, sauces, toppings, extras }, qty);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">{item.name}</DialogTitle>
          <p className="text-muted-foreground text-sm">{item.desc}</p>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {needsMeat && (
            <Section title="Meso" required>
              <div className="grid grid-cols-3 gap-2">
                {MEAT.map((m) => (
                  <Chip key={m} active={meat === m} onClick={() => setMeat(m)}>{m}</Chip>
                ))}
              </div>
            </Section>
          )}
          {showSaucesToppings && (
            <>
              <Section title="Omake">
                <div className="grid grid-cols-2 gap-2">
                  {SAUCES.map((s) => <Chip key={s} active={sauces.includes(s)} onClick={() => toggle(sauces, s, setSauces)}>{s}</Chip>)}
                </div>
              </Section>
              <Section title="Priloge">
                <div className="grid grid-cols-2 gap-2">
                  {TOPPINGS.map((t) => <Chip key={t} active={toppings.includes(t)} onClick={() => toggle(toppings, t, setToppings)}>{t}</Chip>)}
                </div>
              </Section>
              <Section title="Dodatki">
                <div className="grid grid-cols-2 gap-2">
                  {EXTRAS.map((e) => <Chip key={e} active={extras.includes(e)} onClick={() => toggle(extras, e, setExtras)}>{e}</Chip>)}
                </div>
              </Section>
            </>
          )}
          {isPomfri && (
            <Section title="Omaka" required>
              <div className="grid grid-cols-2 gap-2">
                {EXTRAS.map((e) => <Chip key={e} active={extras.includes(e)} onClick={() => toggle(extras, e, setExtras)}>{e}</Chip>)}
              </div>
            </Section>
          )}
        </div>
        <DialogFooter className="!flex-row gap-3 items-center">
          <div className="flex items-center gap-2 bg-muted rounded-full px-1 py-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary"><Minus className="w-3 h-3" /></button>
            <span className="font-bold w-6 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:border-primary"><Plus className="w-3 h-3" /></button>
          </div>
          <Button disabled={!canAdd} onClick={submit} className="flex-1 bg-gradient-flame text-primary-foreground font-bold py-6 rounded-full shadow-flame disabled:opacity-50">
            Dodaj v košarico · {fmt(item.price * qty)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, required, children }: { title: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-semibold text-sm mb-2 flex items-center gap-2">
        {title} {required && <span className="text-primary text-xs">obvezno</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 rounded-full text-sm font-medium border transition flex items-center justify-center gap-1.5 ${
        active ? "bg-gradient-flame text-primary-foreground border-transparent shadow-flame" : "bg-muted/40 border-border text-foreground/80 hover:border-primary"
      }`}
    >
      {active && <Check className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

function CheckoutSheet({ open, onOpenChange, cart, total, onSuccess }: {
  open: boolean; onOpenChange: (o: boolean) => void; cart: CartLine[]; total: number; onSuccess: (orderId: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState<DeliveryCity | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const belowMin = total > 0 && total < MIN_ORDER;
  const cityValid = city !== "" && (DELIVERY_CITIES as readonly string[]).includes(city);
  const formValid =
    name.trim().length > 1 &&
    phone.trim().length >= 6 &&
    street.trim().length >= 3 &&
    cityValid;
  const canSubmit = !submitting && cart.length > 0 && !belowMin && formValid;

  const submit = async () => {
    if (cart.length === 0) { toast.error("Košarica je prazna."); return; }
    if (belowMin) { toast.error("Minimalno naročilo je 7€"); return; }
    if (!cityValid) { toast.error("Dostava trenutno ni na voljo za vaš naslov."); return; }
    if (!formValid) { toast.error("Prosim izpolni vsa polja."); return; }
    if (submitting) return;
    const grand = total + DELIVERY_FEE;
    const address = `${street.trim()}, ${city}`;

    setSubmitting(true);
    try {
      const items = cart.map((l) => ({
        name: l.name,
        qty: l.qty,
        price: l.price,
        options: l.options
          ? {
              meat: l.options.meat,
              sauces: l.options.sauces,
              toppings: l.options.toppings,
              extras: l.options.extras,
            }
          : undefined,
      }));
      const { data, error } = await supabase.functions.invoke("submit-order", {
        body: {
          customer_name: name.trim(),
          phone: phone.trim(),
          address,
          notes: notes.trim() || undefined,
          items,
          food_total: Number(total.toFixed(2)),
          delivery_fee: DELIVERY_FEE,
          total: Number(grand.toFixed(2)),
        },
      });
      if (error || !data?.ok) {
        console.error("submit-order failed", error, data);
        toast.error("Napaka pri pošiljanju naročila. Prosim pokliči nas.");
        return;
      }
      onSuccess(data.orderId as string);
      setName(""); setPhone(""); setStreet(""); setCity(""); setNotes("");
    } catch (e) {
      console.error(e);
      toast.error("Napaka pri pošiljanju naročila. Prosim pokliči nas.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="font-display text-3xl">Naročilo</SheetTitle>
          <p className="text-sm text-muted-foreground">Dostava: Nova Gorica & Solkan · ~30 min · 1,00 €</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <Label htmlFor="ck-name">Ime in priimek</Label>
            <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Janez Novak" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="ck-phone">Telefonska številka</Label>
            <Input id="ck-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="070 123 456" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="ck-street">Ulica in hišna številka</Label>
            <Input id="ck-street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rejčeva ulica 3" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="ck-city">Mesto</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {DELIVERY_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`px-3 py-3 rounded-xl text-sm font-semibold border transition flex items-center justify-center gap-1.5 ${
                    city === c
                      ? "bg-gradient-flame text-primary-foreground border-transparent shadow-flame"
                      : "bg-muted/40 border-border text-foreground/80 hover:border-primary"
                  }`}
                >
                  {city === c && <Check className="w-3.5 h-3.5" />} {c}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Dostava je trenutno na voljo samo za Novo Gorico in Solkan.
            </p>
          </div>
          <div>
            <Label htmlFor="ck-notes">Opombe naročila</Label>
            <Textarea id="ck-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Npr. zvonec ne dela, pokliči ob prihodu…" className="mt-1" />
          </div>
          {belowMin && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 text-red-500 px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <X className="w-4 h-4" /> Minimalno naročilo je 7€ (manjka {fmt(MIN_ORDER - total)})
            </div>
          )}
          {city !== "" && !cityValid && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 text-red-500 px-4 py-3 text-sm font-semibold">
              Dostava trenutno ni na voljo za vaš naslov.
            </div>
          )}
          <div className="bg-muted/40 rounded-2xl p-4 text-sm">
            <div className="flex justify-between mb-1"><span className="text-muted-foreground">Število izdelkov</span><span>{cart.reduce((s, l) => s + l.qty, 0)}</span></div>
            <div className="flex justify-between mb-1"><span className="text-muted-foreground">Hrana</span><span>{fmt(total)}</span></div>
            <div className="flex justify-between mb-1"><span className="text-muted-foreground">Dostava</span><span>{fmt(DELIVERY_FEE)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Skupaj za plačilo</span><span className="font-display text-xl text-gradient-flame">{fmt(total + DELIVERY_FEE)}</span></div>
            <div className="text-xs text-muted-foreground mt-2">Minimalno naročilo: {fmt(MIN_ORDER)} (hrana)</div>
          </div>
          <a href={`tel:${PHONE}`} className="flex items-center justify-center gap-2 border-2 border-border bg-card px-5 py-3 rounded-full font-semibold hover:border-primary transition">
            <Phone className="w-4 h-4" /> Raje pokličem ({PHONE_DISPLAY})
          </a>
        </div>
        <div className="border-t border-border p-6">
          <Button disabled={!canSubmit} onClick={submit} className="w-full bg-gradient-flame text-primary-foreground font-bold py-6 rounded-full shadow-flame text-base hover:scale-[1.01] disabled:opacity-60">
            {submitting
              ? "Pošiljanje…"
              : belowMin
                ? "Minimalno naročilo je 7€"
                : `Oddaj naročilo · ${fmt(total + DELIVERY_FEE)}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
