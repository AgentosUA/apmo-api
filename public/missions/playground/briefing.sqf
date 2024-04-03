if !(hasInterface) exitWith {};

waitUntil { player == player };

switch (side player) do {

player createDiaryRecord ["diary", ["–––––––––––––––––––",  "
"]];

	case WEST: {
	
		player createDiaryRecord ["diary", ["Задача", "
		Удержать <font color='#679DF6'><marker name='mZone_0'>полевой госпиталь</marker></font><br/><br/>
		Если мы его потеряем, то у нас будет 10 минут на контратаку
		"]];
		
		player createDiaryRecord ["diary", ["Условности", "
		Мед. страйкеры и палатки в зоне являются госпиталями<br/><br/>
		Все водители являются инженерами
		"]];
		
		player createDiaryRecord ["diary", ["Вводная", "
		Столконовение РФ и НАТО на территории страны N за влияние в регионе.<br/><br/>
		9 июля 2020 года, 6:00 по местному времени.
		"]];
		
	    player createDiaryRecord ["diary", ["Кто может управлять техникой?","
		Абрамсами могут управлять только члены экипажей
        "]];
		
	};

	case EAST: {
		
		player createDiaryRecord ["diary", ["Задача", "
		Захватить <font color='#679DF6'><marker name='mZone_0'>полевой госпиталь</marker></font> и удержать его в течение 10 минут (после захвата таймер будет обновляться каждые 10 секунд)
		"]];
		
		player createDiaryRecord ["diary", ["Условности", "
		Ми-8 и штабной Тигр являются медицинским транспортом<br/><br/>
		Механики-водители и бортмеханики являются инженерами
		"]];
		
		player createDiaryRecord ["diary", ["Вводная", "
		Столкновение РФ и НАТО на территории страны N за влияние в регионе.<br/><br/>
		9 июля 2020 года, 6:00 по местному времени.
		"]];
		
		player createDiaryRecord ["diary", ["Кто может управлять техникой?","
		Спрутами могут управлять только члены экипажей<br/><br/>
		БМД-4М и БТР-80А могут управлять члены экипажей, командиры отделений и офицеры<br/><br/>
		Ми-8 и Ка-52 могут управлять только пилоты
        "]];
		
	};
};

player createDiaryRecord ["diary", ["Формы сторон",  "
		<font color='#3B85FF'>US Army<br/><br/><img image='Screenshots\US_ARMY.jpg' width='360' height='200'/><br/><br/>
		<font color='#FF0000'>ВДВ РФ<br/><br/><img image='Screenshots\VDV.jpg' width='360' height='200'/><br/><br/>
		<font color='#FF0000'>45-ая ОРБр СпН<br/><br/><img image='Screenshots\45.jpg' width='360' height='200'/><br/><br/>
        "]];


player createDiaryRecord ["diary", ["–––––––––––––––––––",  ""]];
            
/* Полезные теги:
<img image='imgFolder/image.jpg'/> 														// Вставка изображения
<font color='#679DF6'><marker name='markerName'>координатная ссылка</marker></font>		// Текст-ссылка на маркер 'markerName' на карте (выделенный синим цветом)
<font color='#FFA700'>выделенный текст</font>											// Выделение текста цветом (оранжевый в примере)
*/			