const width = 500;
const height = 650;
const margin = { left: 250, right: 50, top: 50, bottom: 20 };
const cell_size = 10;

const date_scale = d3.scaleTime()
  .domain([new Date(1949, 0, 1), Date.now()])
  .range([0, width]);
const x_scale = d3.scaleLinear()
  .domain([0, width/cell_size])
  .range([3, width]);
const y_scale = d3.scaleLinear()
  .domain([0, height/cell_size])
  .range([0, height]);
const freq_scale = d3.scaleLinear()
  .domain([0, height/cell_size + 10])
  .range([0, height]);
const color_scale = d3.scaleOrdinal(d3.schemeTableau10)
  .domain([9, 10]);

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
  svg.selectAll('.person')
      .data(names)
    .join(
      enter => enter.append('text'),
      update => update,
      exit => exit.remove()
    )
      .attr('class', 'person')
      .text(d => d.name)
      .attr('text-anchor', 'end')
      .attr('fill', d => color_scale(d.rama))
      .attr('y', (d, i) => (i+1) * cell_size - 3)
    .transition(t)
      .delay(d => d.years)
      .attr('x', d => projections.x ? 0 : date_scale(new Date(date_from_thai_text(d.date_first).getFullYear(), 0, 1))-2)
      .style('opacity', () => projections.y ? 0 : 1);

  svg.selectAll('.cell')
      .data(cells)
    .join(
      enter => enter.append("rect"),
      update => update,
      exit => exit.remove()
    )
      .attr('class', 'cell')
      .attr('width', cell_size - 1)
      .attr('height', cell_size - 1)
      .attr('fill', d => color_scale(d.rama))
    .transition(t)
      .delay((d, i) => i)
      .attr('x', d => projections.x ? x_scale(d.date_order) : date_scale(d.date))
      .attr('y', d => projections.y ? freq_scale(d.stack) : y_scale(d.order));
  
  // Axes
  svg.select('.x-axis')
    .transition(t)
    .call(
      projections.x ? 
        d3.axisTop(x_scale) :
        d3.axisTop(date_scale)
          .ticks(d3.timeYear.every(10))
          .tickFormat(date => date.getFullYear() + 543)
    );
  
  svg.selectAll('.label').remove();
  if (projections.x) {
    svg.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'start')
      .attr('x', width)
      .attr('dx', 15)
      .attr('y', -19)
      .text('ปี');
  } else {
    svg.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'end')
      .attr('x', 0)
      .attr('dx', -10)
      .attr('y', -19)
      .text('พ.ศ.');
  }

  // Legend
  svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width-100},20)`);
  svg.select(".legend")
  .call(d3.legendColor()
    .shapeWidth(cell_size-1)
    .shapeHeight(cell_size-1)
    .shapePadding(0)
    .labels(["รัชกาลที่ 9", "รัชกาลที่ 10"]) //(d => `รัชกาลที่ ${d}`)
    .scale(color_scale)
  );
}

const project_buttons = {
  x: d3.select('#project-button-x'),
  y: d3.select('#project-button-y')
}
let projections = { x: false, y: false };
let project_along = axis => {
  projections[axis] = !projections[axis];
  project_buttons.x.text(projections.x ? 'ดูช่วงเวลาของแต่ละคน' : 'ดูจำนวนปีของแต่ละคน');
  project_buttons.y.text(projections.y ? 'ดูช่วงเวลาของแต่ละคน' : 'ดูจำนวนคนในแต่ละช่วงเวลา');
  // TODO change it to toggle buttons: ดูช่วงเวลาของแต่ละคน, ดูจำนวนปีของแต่ละคน, ดูจำนวนคนในแต่ละช่วงเวลา

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
  names_by_month = {};
  data.forEach((d, idx) => {
    let counter = 0;
    for(let date = date_from_thai_text(d.date_first); date <= date_from_thai_text(d.date_last); date.setFullYear(date.getFullYear() + 1)) {
      let year = date.getFullYear();
      if (!names_by_month[year]) {
        names_by_month[year] = [];
      }

      cells.push({
        rama: (date < date_from_thai_text('6 ธันวาคม พ.ศ. 2559')) ? 9 : 10,
        name: d.name,
        date: new Date(year, 0, 1), //new Date(date.getTime()),
        date_order: counter++,
        order: idx,
        stack: names_by_month[year].length
      });

      names_by_month[year].push(d.name);
    }
    names[idx].years = (idx === 0) ? counter : (names[idx-1].years + counter);
  });

  svg.append('g')
    .attr("class", "x-axis")
    .attr("transform", "translate(0,-10)");
  // svg.append("g")
  //   .attr("class", "x axis")
  //   .attr("transform", "translate(0,-10)");

  draw();
});