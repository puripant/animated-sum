const width = 500;
const height = 700;
const margin = { left: 250, right: 50, top: 20, bottom: 20 };
const cell_size = 10;

const date_scale = d3.scaleLinear()
  .domain([new Date(1949, 0, 1), Date.now()])
  .range([0, width]);
const x_scale = d3.scaleLinear()
  .domain([0, width/cell_size])
  .range([3, width]);
const y_scale = d3.scaleLinear()
  .domain([0, height/cell_size])
  .range([0, height]);
const color_scale = d3.scaleOrdinal(d3.schemeTableau10);

const svg = d3.select('#chart')
  .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
const t = svg.transition().duration(750);

let names = [];
let cells = [];
let draw = () => {
  svg.selectAll('text')
      .data(names)
    .join('text')
      .attr('class', 'person')
      .text(d => d.name)
      .attr('text-anchor', 'end')
      .attr('fill', d => color_scale(d.rama))
      .attr('y', (d, i) => (i+1) * cell_size - 3)
      // .attr('x', d => projections.x ? date_scale(date_from_thai_text(d.date_first))-2 : 0)
    .transition(t)
      .delay(d => d.years)
      .attr('x', d => projections.x ? 0 : date_scale(date_from_thai_text(d.date_first))-2);

  svg.selectAll('rect')
      .data(cells)
    .join('rect')
      .attr('class', 'cell')
      .attr('width', cell_size - 1)
      .attr('height', cell_size - 1)
      .attr('fill', d => color_scale(d.rama))
      .attr('y', d => y_scale(d.order))
    .transition(t)
      .delay((d, i) => i)
      .attr('x', d => projections.x ? x_scale(d.date_order) : date_scale(d.date));
}

const project_button = d3.select('#project-button');
let projections = { x: false, y: false };
let project_to = axis => {
  projections[axis] = !projections[axis];
  project_button.text(projections[axis] ? 'เปลี่ยนเป็นช่วงเวลา' : 'เปลี่ยนเป็นจำนวนปี');

  draw();
}

let month_from_thai_text = (text) => {
  return ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน', 'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].indexOf(text);
}
let date_from_thai_text = (text) => {
  if(text === 'ปัจจุบัน') {
    return Date.now();
  } else {
    let text_array = text.split(' ');
    if (text_array.length === 4) {
      return new Date(text_array[3] - 543, month_from_thai_text(text_array[1]), +text_array[0]);
    } else if (text_array.length === 2) {
      return new Date(text_array[1] - 543, 11, 31);
    } else {
      console.log(text_array);
      return undefined;
    }
  }
}

d3.csv('data.csv').then(data => {
  names = data;
  data.forEach((d, idx) => {
    let counter = 0;
    for(let date = date_from_thai_text(d.date_first); date <= date_from_thai_text(d.date_last); date.setFullYear(date.getFullYear() + 1)) {
      cells.push({
        rama: d.rama,
        name: d.name,
        date: new Date(date.getTime()),
        date_order: counter++,
        order: idx,
      })
    }
    names[idx].years = (idx === 0) ? counter : (names[idx-1].years + counter);
  });

  draw();
});