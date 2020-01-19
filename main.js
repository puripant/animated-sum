const width = 600;
const height = 600;
const margin = { left: 50, right: 50, top: 50, bottom: 50 };
const cell_size = 10;

const date_scale = d3.scaleLinear()
  .domain([new Date(1940, 0, 1), Date.now()])
  .range([0, width]);
const x_scale = d3.scaleLinear()
  .domain([0, width/cell_size])
  .range([0, width]);
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

let cells = [];
let draw = () => {
  svg.selectAll('rect')
      .data(cells)
    .join('rect')
      .attr('class', 'cell')
      .attr('width', cell_size)
      .attr('height', cell_size)
      .attr('fill', d => color_scale(d.rama))
    .transition(t)
      .attr('x', d => projections.x ? x_scale(d.date_order) : date_scale(d.date))
      .attr('y', d => y_scale(d.order));
}

let projections = { x: false, y: false };
let project_to = axis => {
  projections[axis] = !projections[axis];
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
    if (text_array.length < 4) {
      console.log(text_array)
      return undefined;
    } else {
      return new Date(text_array[3] - 543, month_from_thai_text(text_array[1]), +text_array[0]);
    }
  }
}

d3.csv('data.csv').then(data => {
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
  });

  draw();
});