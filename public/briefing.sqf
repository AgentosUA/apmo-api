waitUntil {
    !isnil {
        player
    }
};
waitUntil {
    player == player
};

switch (side player) do
{
    case east:
    {
        player createDiaryRecord ["diary", ["Legend | Легенда", "EN:<br/>A couple of days ago we were given the two tochka-U missile systems. However, during transportation the warhead launch mechanism was damaged. We need to carry out repairs, but the necessary spare parts will arrive in at least 2 hours. The Americans clearly will not sit idly by. The security of the complex must be ensured.<br/><br/>UA:<br/>Кілька днів тому нам було передано два ракетних комплекса Точка-У. Однак, під час транспортування були пошкоджені механізми запуску бойової частини. Нам необхідно здійснити ремонт, проте необхідні запчастини прибудуть щонайменше за 2 години. Американці явно не сидітимуть склавши руки. Необхідно забезпечити безпеку комплексів.<br/><br/>RU:<br/>Пару дней назад нам было передано 2 ракетных комплекса Точка-У. Однако, в ходе транспортировки был поврежден механизм запуска боевой части. Нам необходимо осуществить ремонт, однако необходимые запчасти прибудут минимум через 2 часа. Американцы явно не будут сидеть сложа руки. Необходимо обеспечить безопасность комплексов."]];
        
        player createDiaryRecord ["diary", ["Task | Задача", "EU:<br/>Defend at least one Tochka-U missile complex from an American attack.<br/><br/>UA:<br/>Захистити хоча б один ракетний комплекс Точка-У від атаки американців.<br/><br/>RU:<br/>Защитить хотя бы один ракетный комплекс Точка-У от атаки американцев."]];
        
        player createDiaryRecord ["diary", [localize "str_enemy_look", "
            <img image='textures\USMC.jpg' width='382' height='501'>
        "]];
        
        player createDiaryRecord ["diary", [localize "str_friendly_look", "
            <img image='textures\cdkz.jpg' width='382' height='501'>
        "]];
    };
    case west:
    {
        player createDiaryRecord ["diary", ["Легенда | Legend", "EN:<br/>A couple of days ago, our reconnaissance discovered two Tochka-U’s, previously handed over to the ChDKZ, in the area of the settlement. Mogilevka. We are afraid that this missile systems could cause irreparable damage to both the civilians of Chernogorsk and the remnants of the resistance forces. Our spy in the ranks of ChDKZ was able to attach a GPS tracker to Tochka-U’s. We refuel the helicopters, load into the cars and hit the road. It is necessary to destroy Tochka-U before it is too late.<br/><br/>UA:<br/>Кілька днів тому наша розвідка виявила передані раніше ЧДКЗ 2 Точки-У в районі н.п. Могилівка. Ми боїмося, що ці ракетні комплекси можуть завдати непоправної шкоди як мирним жителям Чорногорська, так і залишкам сил опору. Наш шпигун у лавах ЧДКЗ зміг причепити GPS-трекер на 2 комплекса Точка-У. Заправляємо вертольоти, сідаємо по машинам і в дорогу. Необхідно знищити Точки-У, поки не пізно.<br/><br/>RU:<br/>Пару дней назад наша разведка обнаружила переданные ранее ЧДКЗ Точки-У в районе н.п. Могилёвка. Мы боимся, что эти ракетные комплексы могут нанести непоправимый урон как мирным жителям Черногорска, так и остаткам сил сопротивления. Наш шпион в рядах ЧДКЗ смог прицепить GPS-трекер на 2 Точки-У. Заправляем вертолёты, грузимся по машинам и в дорогу. Необходимо уничтожить Точки-У, пока ещё не поздно."]];
        
        player createDiaryRecord ["diary", ["Задача | Task", "EN:<br/>It is necessary to find and destroy two Tochka-U missile systems.<br/><br/>UA:<br/>Необхідно знайти та знищити два ракетних комплекса Точка-У.<br/><br/>RU:<br/>Необходимо найти и уничтожить два ракетных комплекса Точка-У."]];
        player createDiaryRecord ["diary", [localize "str_enemy_look", "
            <img image='textures\cdkz.jpg' width='382' height='501'>
        "]];
        
        player createDiaryRecord ["diary", [localize "str_friendly_look", "
            <img image='textures\USMC.jpg' width='382'>
        "]];
    };
};

player createDiaryRecord ["diary", [localize "str_mission_conditions_title", localize "str_mission_conditions"]];