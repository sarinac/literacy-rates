const 
    pageWidth = 1000,
    pageHeight = 0.8 * pageWidth,
    pagePadding = 50;

let svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", pageWidth)
    .attr("height", pageHeight);



d3.json("data/data.json").then((data) => {

    console.log(data);

    //////////////////////////////////////////////////////////////////////
    //////////////////////////////// Draw ////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    
    dataCountry = data.country;
    dataRegion = data.region;
    dataIncome = data.income;

    chartLinks = svg.append("g").attr("id", "link");
    chartCountries = svg.append("g").attr("id", "country");
    chartRegions = svg.append("g").attr("id", "region");
    chartIncomes = svg.append("g").attr("id", "income");

    let 
        tooltipWidth = 140,
        tooltipHeight = 60;
    tooltip = svg.append("g").attr("id", "tooltip").classed("hidden", true);
    tooltipRect = tooltip.append("rect").attr("id", "tooltip-rect").attr("width", tooltipWidth).attr("height", tooltipHeight).attr("x", 0).attr("y", 0);
    tooltipCountry = tooltip.append("text").attr("id", "tooltip-country").attr("x", tooltipWidth / 2).attr("y", tooltipHeight * 0.2);
    tooltipLiteracy = tooltip.append("text").attr("id", "tooltip-literacy").attr("x", tooltipWidth / 2).attr("y", tooltipHeight * 0.55);
    tooltipGap = tooltip.append("text").attr("id", "tooltip-gap").attr("x", tooltipWidth / 2).attr("y", tooltipHeight * 0.8);

    let 
        worldWidth = 140,
        worldHeight = 40,
        worldPadding = 5;
    world = svg.append("g").attr("id", "world");
    world.append("rect").attr("width", worldWidth).attr("height", worldHeight).attr("x", pageWidth-pagePadding-worldWidth).attr("y", pagePadding+worldHeight);
    world.append("text").attr("x", pageWidth-pagePadding-worldWidth+worldPadding).attr("y", pagePadding+1.3*worldHeight)
        .text("The Global Female Literacy Rate and Gender Gap is noted with X.")
        .call(wrap, worldWidth-2*worldPadding);

    // let rCountryScale = d3
    //     .scaleLinear()
    //     .domain([-1, 10.5])
    //     .range([pagePadding, pageWidth - pagePadding]);
    let colorRegionClass = (r) => {
        c = d3
            .scaleOrdinal()
            .domain(["Sub-Saharan Africa", "South Asia", "Middle East & North Africa", "Latin America & Caribbean", "East Asia & Pacific", "Europe & Central Asia"])
            .range([0, 1, 2, 3, 4, 5])(r)
        return `p${c}-color`
    }

    ///////////////////////////////////////////////////////////////////////
    //////////////////////////////// Waves ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////

    const 
        regionRatioHeight = 0.1,
        regionRatioWidth = 1,
        overlapRatio = 0.65;

    // Scales
    /* 
        Region
        ------
        x = literacy_end_f (sort by index)
        sizeBack = latest literacy rate of the gender: literacy_end_f
        sizeFront = earliest literacy rate of the gender: literacy_start_f
        color = region: name
    */
    let positionRegionCumulative =  regionRatioWidth * (pageWidth - pagePadding),
        positionRegionLookup = {};
    let xPositionRegionScale = d3
        .scaleLinear()
        .domain([0, d3.sum(dataRegion, d => d.literacy_end_f)])
        .range([pagePadding, positionRegionCumulative]);
    let ySizeRegionScale = d3
        .scaleLinear()
        .domain([0, d3.max(dataRegion, d => Math.max(d.literacy_end_f, d.literacy_end_m))])
        .range([0, regionRatioHeight * pageHeight]);

    // Draw
    /*
        chartRegions
            gRegions
                gBackRegions
                    pathBackRegions
                gFrontRegions
                    pathFrontRegions
                gTextureRegions
                    pathTextureRegions
                gTextRegions
                    textNameRegions
            gAxisRegions
    */
 
    gRegions = chartRegions
        .selectAll("g")
        .data(dataRegion.sort((a, b) => b.index - a.index))
        .enter()
        .append("g")
        .attr("class", "regions")
        .attr("id", d => `region-${convertToLowerCase(d.name)}`)
        .attr("transform", (d) => {
            positionRegionLookup[d.name] = positionRegionCumulative;
            p = overlapRatio * xPositionRegionScale(d.literacy_end_f);
            positionRegionCumulative = positionRegionCumulative - p;  // Update cumulative value
            return `translate(${positionRegionCumulative - p}, ${pageHeight - pagePadding})`;
        })
        .on("mouseover", (d, i) => {
            d3.selectAll(".regions, .region-links")
                .filter((e) => e.name !=i.name)
                .classed("deselect", true);
            d3.selectAll(".countries")
                .filter((e) => e.region !=i.name)
                .classed("deselect", true);
            // d3.selectAll(".regions, .region-links")
            //     .filter((e) => e.name == i.name)
            //     .classed("select", true);
            // d3.selectAll(".countries")
            //     .filter((e) => e.region == i.name)
            //     .classed("select", true);


            // Tooltip
            d3.select("#tooltip-country").text(i.name);
            d3.select("#tooltip-literacy").text(i.literacy_end_f.toFixed(1) + "% ♀ Literacy Rate");
            d3.select("#tooltip-gap").text(i.literacy_end_gap.toFixed(1) + "% ♂-♀ Gap")
            d3.select("#tooltip")
                .attr("transform", () => {
                    x = positionRegionLookup[i.name] -  xPositionRegionScale(i.literacy_end_f);
                    y = pageHeight * (1 - regionRatioHeight) - tooltipHeight - pagePadding;
                    return `translate(${x},${y})`;
                })
                .classed("hidden", false);
        })
        .on("mouseout", (d, i) => {
            d3.selectAll(".regions, .region-links")
                .classed("deselect", false)
                .classed("select", false);
            d3.selectAll(".countries")
                .classed("deselect", false)
                .classed("select", false);
            d3.select("#tooltip").classed("hidden", false);
        });

    gBackRegions = gRegions.append("g").attr("class", "region-back");
    gFrontRegions = gRegions.append("g").attr("class", "region-front");
    gTextureRegions = gRegions.append("g").attr("class", "region-texture");
    gTextRegions = gRegions.append("g").attr("class", "region-text");
    gAxisRegions = chartRegions.append("g").attr("class", "region-axis axis");

    let regionTangentRatio = 0.31;
    drawRegionPath = (x, y) => {
        return [
            "M 0,0",
            `C 0, -${0.26 * y}`, 
                `${0.08 * x},-${y}`, 
                `${regionTangentRatio * x},-${y}`,
            `C ${0.56 * x},-${y}`, 
                `${0.62 * x},0`, 
                `${x},0`,
            "Z",
        ].join(" ")
    }

    pathBackRegions = gBackRegions
        .append("path")
        .attr("class", d => `region-back-paths ${colorRegionClass(d.name)}`)
        .attr("d", (d) => drawRegionPath(xPositionRegionScale(d.literacy_end_f), ySizeRegionScale(d.literacy_end_f)));
    
    pathFrontRegions = gFrontRegions
        .append("path")
        .attr("class", d => `region-front-paths ${colorRegionClass(d.name)} ${colorRegionClass(d.name)}-outline`)
        .attr("d", (d) => drawRegionPath(xPositionRegionScale(d.literacy_start_f), ySizeRegionScale(d.literacy_start_f)));
    
    pathTextureRegions = gTextureRegions
        .selectAll("path")
        .data(d => [...Array(10).keys()].map((i) => [d.literacy_start_f,10*(i+1), d.name]))  // Not sure if JS has list comprehension like Python...
        .enter()
        .filter(d => d[0] > d[1])
        .append("path")
        .attr("class", d => `region-texture-paths ${colorRegionClass(d[2])}-outline`)
        .attr("d", (d) => drawRegionPath(xPositionRegionScale(d[0]), ySizeRegionScale(d[1])));
    
    textNameRegions = gTextRegions 
        .append("text")
        .attr("class", d => `region-text-names ${colorRegionClass(d.name)}`)
        .text(d => d.name)
        .attr("x", d => 0.9 * xPositionRegionScale(d.literacy_start_f))
        .attr("y", 12)
        .call(wrap, 80);

    gAxisRegions
        .append("path")
        .attr("d", `M0,${pageHeight - pagePadding} L${pageWidth},${pageHeight - pagePadding}`);
    // gAxisRegions
    //     .append("text")
    //     .text("Regions")
    //     .attr("x", 0)
    //     .attr("y", pageHeight - pagePadding - 4);
        

    ///////////////////////////////////////////////////////////////////////
    ////////////////////////////// Countries //////////////////////////////
    ///////////////////////////////////////////////////////////////////////
    
    const 
        scatterRatio = 0.2;

    // Scales
    /* 
        Country
        -------
        dashed radius = absolute growth of the gender: literacy_growth_abs_f, literacy_growth_abs_m
        radius = relative growth of the gender: literacy_growth_rel_f, literacy_growth_rel_m
        x = latest literacy rate of the gender: literacy_end_f, literacy_end_m
        y = latest gap between genders: literacy_end_gap

        Year
        ----
        petal size = literacy rate of the gender for the year: literacy_f
        rotate = year: year_index
    */
    const 
        rCountryMin = 2,
        rCountryMax = 50;

    // literacy_growth_rel_f
    let rCountryScale = d3
        .scaleLinear()
        .domain([d3.min(dataCountry, d => Math.min(d.literacy_growth_rel_f, d.literacy_growth_rel_m)), d3.max(dataCountry, d => Math.max(d.literacy_growth_rel_f, d.literacy_growth_rel_m))])
        .range([rCountryMin, rCountryMax]);
    let rCountryScale2 = d3
        .scalePow().exponent(0.4)
        .domain([d3.min(dataCountry, d => Math.min(d.literacy_growth_rel_f, d.literacy_growth_rel_m)), d3.max(dataCountry, d => Math.max(d.literacy_growth_rel_f, d.literacy_growth_rel_m))])
        .range([1, 8]);

    // literacy_end_gap
    let yCountryScale = d3
        .scalePow().exponent(0.5)
        // .scaleLinear()
        .domain([-1.2, d3.max(dataCountry, d => d.literacy_end_gap)])
        .range([pagePadding + (1 - scatterRatio) * (pageHeight - 2 * pagePadding), pagePadding]);

    // literacy_end_f
    let xCountryScale = d3
        .scalePow().exponent(3)
        // .scaleLinear()
        .domain([d3.min(dataCountry, d => Math.min(d.literacy_end_f, d.literacy_end_m)), 100])
        .range([pagePadding, pageWidth - pagePadding]);

    // literacy_growth_abs_f
    let rCountryPetalScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([rCountryMin, rCountryMax]);

    // Draw
    /*
        chartCountries
            gAxisCountries
                gAxisCountriesY
                gAxisCountriesX
            gCountries
                gAllFemaleCountries
                    gFemaleCountries
                        polygonRelFemaleCountriesBack
                        polygonAbsFemaleCountries
                        polygonRelFemaleCountriesFront
                    gPetalCountries
                        pathPetalCountries
                    gYearsFemaleCountries
                        polygonYearsFemaleCountries
                gAllMaleCountries
                    gMaleCountries
                        polygonRelMaleCountriesBack
                        polygonAbsMaleCountries
                        polygonRelMaleCountriesFront 
    */
    gAxisCountries = chartCountries.append("g").attr("class", "axis");
    gCountries = chartCountries.append("g").attr("class", "countries-main");
    gAllMaleCountries = gCountries.append("g").attr("class", "male");
    gAllFemaleCountries = gCountries.append("g").attr("class", "female");
    gWorld = gCountries.append("g").attr("class", "world female");
    
    gFemaleCountries = gAllFemaleCountries
        .selectAll("g")
        .data(dataCountry)
        .enter()
        .filter(d => d.literacy_end_gap >= -5)
        .append("g")
        .attr("class", d => `countries ${convertToLowerCase(d.name)}`)
        .attr("transform", (d) => `translate(${xCountryScale(d.literacy_end_f)},${yCountryScale(d.literacy_end_gap)})`);
    gMaleCountries = gAllMaleCountries
        .selectAll("g")
        .data(dataCountry)
        .enter()
        .filter(d => d.literacy_end_gap >= -5)
        .append("g")
        .attr("class", d => `countries ${convertToLowerCase(d.name)}`)
        .attr("transform", (d) => `translate(${xCountryScale(d.literacy_end_m)},${yCountryScale(d.literacy_end_gap)})`);
    
    mapIncome = d3.scaleOrdinal().domain(["Low income", "Lower middle income", "Upper middle income", "High income"]).range([3, 4, 5, 6]);
    drawIncomeShape = (income, radius) => {
        points = createPolygon(mapIncome(income), rCountryScale(radius));
        strPoints = [];
        strPoints.push(`M${points[0].x},${points[0].y}`);
        for (let i=1; i < points.length; i++) {
            strPoints.push(`L${points[i].x},${points[i].y}`);
        }
        strPoints.push("Z");
        return strPoints.join(" ");
    };
    drawIncomeShape2 = (income, radius) => {
        points = createPolygon(mapIncome(income), rCountryScale2(radius));
        strPoints = [];
        strPoints.push(`M${points[0].x},${points[0].y}`);
        for (let i=1; i < points.length; i++) {
            strPoints.push(`L${points[i].x},${points[i].y}`);
        }
        strPoints.push("Z");
        return strPoints.join(" ");
    };

    polygonRelMaleCountriesBack = gMaleCountries
        .filter(d => d.literacy_growth_rel_m >= d.literacy_growth_abs_m)
        .append("path")
        .attr("class", d => `country-circle country-circle-relative ${colorRegionClass(d.region)}-stroke`)
        .attr("d", (d) => drawIncomeShape(d.income, d.literacy_growth_rel_m));
    polygonAbsMaleCountries = gMaleCountries
        .filter(d => d.year_end >= 2015)
        .append("path")
        .attr("class", d => `country-circle country-circle-absolute ${colorRegionClass(d.region)} ${colorRegionClass(d.region)}-outline`)
        .attr("d", (d) => drawIncomeShape(d.income, d.literacy_growth_abs_m));
    polygonRelMaleCountriesFront = gMaleCountries
        .filter(d => d.literacy_growth_rel_m < d.literacy_growth_abs_m)
        .append("path")
        .attr("class", d => `country-circle country-circle-relative ${colorRegionClass(d.region)}-outline`)
        .attr("d", (d) => drawIncomeShape(d.income, d.literacy_growth_rel_m));
    polygonRelFemaleCountriesBack = gFemaleCountries
        .filter(d => d.literacy_growth_rel_f >= d.literacy_growth_abs_f)
        .append("path")
        .attr("class", d => `country-circle country-circle-relative ${colorRegionClass(d.region)}-stroke`)
        .attr("d", (d) => drawIncomeShape(d.income, d.literacy_growth_rel_f));
    polygonAbsFemaleCountries = gFemaleCountries
        .filter(d => d.year_end >= 2015)
        .append("path")
        .attr("class", d => `country-circle country-circle-absolute ${colorRegionClass(d.region)} ${colorRegionClass(d.region)}-outline`)
        .attr("d", (d) => drawIncomeShape(d.income, d.literacy_growth_abs_f));
    polygonRelFemaleCountriesFront = gFemaleCountries
        .filter(d => d.literacy_growth_rel_f < d.literacy_growth_abs_f)
        .append("path")
        .attr("class", d => `country-circle country-circle-relative ${colorRegionClass(d.region)}-outline`)
        .attr("d", (d) => drawIncomeShape(d.income, d.literacy_growth_rel_f));

    polygonAbsFemaleCountries
        .on("mouseover", (d, i) => {
            d3.selectAll(".regions, .region-links")
                .filter((e) => e.name !=i.region)
                .classed("deselect", true);
            d3.selectAll(".countries")
                .filter((e) => e.name !=i.name)
                .classed("deselect", true);
            d3.selectAll(".countries")
                .filter((e) => e.name == i.name)
                .classed("select", true);
            // Tooltip
            d3.select("#tooltip-country").text(i.name);
            d3.select("#tooltip-literacy").text(i.literacy_end_f.toFixed(1) + "% ♀ Literacy Rate");
            d3.select("#tooltip-gap").text(i.literacy_end_gap.toFixed(1) + "% ♂-♀ Gap")
            d3.select("#tooltip")
                .attr("transform", () => {
                    x = xCountryScale(i.literacy_end_f) + (i.literacy_end_f < 80 ? rCountryScale(i.literacy_growth_abs_f) + 3 : - tooltipWidth - 3 - rCountryScale(i.literacy_growth_abs_f));
                    y = yCountryScale(i.literacy_end_gap) + (i.literacy_end_gap < 15 ? -3 - tooltipHeight - rCountryScale(i.literacy_growth_abs_f): 3 + rCountryScale(i.literacy_growth_abs_f));
                    return `translate(${x},${y})`;
                })
                .classed("hidden", false);
            
        })
        .on("mouseout", (d, i) => {
            d3.selectAll(".regions, .region-links")
                .classed("deselect", false)
                .classed("select", false);
            d3.selectAll(".countries")
                .classed("deselect", false)
                .classed("select", false);
            d3.select("#tooltip")
                .classed("hidden", true);
        });
    
    gYearsFemaleCountries = gFemaleCountries
        .filter(d => d.num_years >= 8)
        .append("g")
        .attr("class", "countries-years")
        .attr("transform", (d) => `translate(${-xCountryScale(d.literacy_end_f)},${-yCountryScale(d.literacy_end_gap)})`);
    polygonYearsFemaleCountries = gYearsFemaleCountries
        .selectAll("path")
        .data(d => d.data)
        .enter()
        .append("path")
        .attr("transform", (d) => `translate(${xCountryScale(d.literacy_f)},${yCountryScale(d.literacy_m - d.literacy_f)})`)
        .attr("d", (d) => drawIncomeShape2(d.income, d.country_all_years_abs_growth_f))
        .attr("class", d => `country-years year-${d.year}`);
    
    // gPetalCountries = gFemaleCountries.append("g").attr("class", "countries-petals");
    // pathPetalCountries = gPetalCountries
    //     .selectAll("path")
    //     .data(d => d.data)
    //     .enter()
    //     .filter(d => d.country_all_years_abs_growth_f > 1)  // Filter to countries who have experienced more than 1% absolute growth in the past 10 years
    //     .append("path")
    //     .attr("class", "country-petal-path")
    //     .attr("d", (d) => {
    //         calcWidth = (width) => Math.max(0.5 * rCountryMin, 0.15 * rCountryPetalScale(width));
    //         calcLength = (length) => rCountryPetalScale(length);
    //         return [
    //             "M 0,0",
    //             `C ${-calcWidth(d.literacy_f)},${0.25*calcLength(d.literacy_f)} ${-calcWidth(d.literacy_f)},${0.75*calcLength(d.literacy_f)} 0,${calcLength(d.literacy_f)}`,
    //             `C ${calcWidth(d.literacy_f)},${0.75*calcLength(d.literacy_f)} ${calcWidth(d.literacy_f)},${0.25*calcLength(d.literacy_f)} 0,0`,
    //             "Z",
    //         ].join(" ")
    //     })
    //     .attr("transform", (d) => `rotate(${-10 * d.year_index})`);

    gAxisCountriesY = gAxisCountries
        .append("g")
        .attr("id", "country-axis-y-gap")
        .attr("transform", `translate(${pageWidth - 0.3 * pagePadding}, 0)`)
        .call(d3.axisLeft().scale(yCountryScale).ticks(5).tickFormat(x => `${x}%`).tickSize(pageWidth - pagePadding))
        .call(g => g.select(".domain").remove());  // Remove axis line
    gAxisCountriesY
        .append("text")
        .attr("class", "axis-label")
        .text("2020 Female Literacy Rates from Lowest to Highest (%) →")
        .attr("x", -pageWidth + pagePadding)
        .attr("y",  0.4 * pagePadding);
    gAxisCountriesX = gAxisCountries
        .append("g")
        .attr("id", "country-axis-x-gender")
        .attr("transform", `translate(0, ${pageHeight - pagePadding})`)
        .call(d3.axisTop().scale(xCountryScale).tickFormat(x => `${x}%`).tickSize(pageHeight - 2*pagePadding))
        .call(g => g.select(".domain").remove());  // Remove axis line
    gAxisCountriesX
        .append("text")
        .attr("class", "axis-label")
        .text("2020 Literacy Gap between Male and Female (%)")
        .attr("transform", "rotate(-90)")
        .attr("x", pagePadding)
        .attr("y", 10);
    // Remove 20% (first item) from x-axis because it's too close to 30%
    gAxisCountriesX.select("g").remove();
    
    // The World
    gWorld
        .append("text")
        .text("x")
        .style("text-anchor", "middle")
        .attr("x", xCountryScale(83.459137))
        .attr("y", yCountryScale(6.704269));



///////////////////////////////////////////////////////////////////////
//////////////////////////////// Links ////////////////////////////////
///////////////////////////////////////////////////////////////////////

    // Draw
    /*
        chartLinks
            gLinks
                gPathLinksMedian
                    gPathLinksMedianRegions
                        pathLinksMedianBack
                        pathLinksMedianFront
                        circleLinksMedianFill
                gPathLinksAverage
                    gPathLinksAverageRegions
                        pathLinksAverageBack
                        pathLinksAverageFront
                        circleLinksAverageFill
            gLinkCircles
                gPathLinkCirclesMedian
                    gPathLinkCirclesMedianRegions
                        circleMedian    
                        circleMedianFront
                gPathLinkCirclesAverage
                    gPathLinkCirclesAverageRegions
                        circleAverage    
                        circleAverageFront
                        circleAverageSide
    */
    let circleRegionR = 4.2;

    gLinks = chartLinks.append("g").attr("class", "region-link-strings");
    gPathLinksMedian = gLinks.append("g").attr("class", "region-links-median");
    gPathLinksAverage = gLinks.append("g").attr("class", "region-links-average");
    // Strokes only
    gLinkCircles = chartLinks.append("g").attr("class", "region-link-circles");

    gPathLinksMedianRegions = gPathLinksMedian
        .selectAll("g")
        .data(dataRegion)
        .enter()
        .append("g")
        .attr("class", d => `region-links region-links-median ${convertToLowerCase(d.name)}`);
    gPathLinksAverageRegions = gPathLinksAverage
        .selectAll("g")
        .data(dataRegion)
        .enter()
        .append("g")
        .attr("class", d => `region-links region-links-average ${convertToLowerCase(d.name)}`);

    gPathLinkCirclesMedian = gLinkCircles.append("g").attr("class", "region-link-circles-median");
    gPathLinkCirclesMedianRegions = gPathLinkCirclesMedian
        .selectAll("g")
        .data(dataRegion)
        .enter()
        .append("g")
        .attr("class", d => `region-links region-links-median ${convertToLowerCase(d.name)}`);
    gPathLinkCirclesAverage = gLinkCircles.append("g").attr("class", "region-link-circles-average");
    gPathLinkCirclesAverageRegions = gPathLinkCirclesAverage.selectAll("g")
        .data(dataRegion)
        .enter()
        .append("g")
        .attr("class", d => `region-links region-links-average ${convertToLowerCase(d.name)}`);

    drawRegionLinkPath = (name, regionEnd, countryEnd, gap, growth) => {
        let 
            yOffset = circleRegionR * rCountryScale(growth),
            regionX = positionRegionLookup[name] - xPositionRegionScale(regionEnd),
            regionY = - ySizeRegionScale(regionEnd) + (pageHeight - pagePadding),
            countryX = xCountryScale(countryEnd),
            countryY = yCountryScale(gap),
            distanceY = regionY - countryY;
        return [
            `M${regionX},${distanceY + countryY}`,  // Tangent of Region Back
            `C${regionX},${0.6 * distanceY + countryY}`,  // x is same, y is portion of distance
                `${countryX},${0.8 * distanceY + countryY}`,  // x of country, y is portion of distance
                `${countryX},${countryY + yOffset}`,  // Country coordinate
        ].join(" ")
    }
    pathLinksMedianBack = gPathLinksMedianRegions
        .append("path")
        .attr("class", d => `region-link region-link-back`)
        .attr("d", d => drawRegionLinkPath(d.name, d.literacy_end_f, d.literacy_f_median, d.gap_median, d.literacy_growth_abs_f));
    pathLinksMedianFront = gPathLinksMedianRegions
        .append("path")
        .attr("class", d => `region-link region-link-front ${colorRegionClass(d.name)}`)
        .attr("d", d => drawRegionLinkPath(d.name, d.literacy_end_f, d.literacy_f_median, d.gap_median, d.literacy_growth_abs_f));
    pathLinksAverageBack = gPathLinksAverageRegions
        .append("path")
        .attr("class", d => `region-link region-link-back`)
        .attr("d", d => drawRegionLinkPath(d.name, d.literacy_end_f, d.literacy_end_f, d.literacy_end_gap, d.literacy_growth_abs_f));
    pathLinksAverageFront = gPathLinksAverageRegions
        .append("path")
        .attr("class", d => `region-link region-link-front ${colorRegionClass(d.name)}`)
        .attr("d", d => drawRegionLinkPath(d.name, d.literacy_end_f, d.literacy_end_f, d.literacy_end_gap, d.literacy_growth_abs_f));

    circleMedian = gPathLinkCirclesMedianRegions
        .append("circle")
        .attr("cx", d => xCountryScale(d.literacy_f_median))
        .attr("cy", d=> yCountryScale(d.gap_median))
        .attr("r", d => circleRegionR * rCountryScale(d.literacy_growth_abs_f))
        .attr("class", "region-link-circle region-link-circle-back");
    circleMedianFront = gPathLinkCirclesMedianRegions
        .append("circle")
        .attr("cx", d => xCountryScale(d.literacy_f_median))
        .attr("cy", d=> yCountryScale(d.gap_median))
        .attr("r", d => circleRegionR * rCountryScale(d.literacy_growth_abs_f))
        .attr("class", d => `region-link-circle region-link-circle-front ${colorRegionClass(d.name)}-stroke`);
    circleAverage = gPathLinkCirclesAverageRegions
        .append("circle")
        .attr("cx", d => xCountryScale(d.literacy_end_f))
        .attr("cy", d=> yCountryScale(d.literacy_end_gap))
        .attr("r", d => circleRegionR * rCountryScale(d.literacy_growth_abs_f))
        .attr("class", "region-link-circle region-link-circle-back");
    circleAverageFront = gPathLinkCirclesAverageRegions
        .append("circle")
        .attr("cx", d => xCountryScale(d.literacy_end_f))
        .attr("cy", d=> yCountryScale(d.literacy_end_gap))
        .attr("r", d => circleRegionR * rCountryScale(d.literacy_growth_abs_f))
        .attr("class", d => `region-link-circle region-link-circle-front ${colorRegionClass(d.name)}-stroke`);

    // Mark the side with average
    circleAverageSide = gPathLinkCirclesAverageRegions
        .append("circle")
        .attr("cx", d => (d.literacy_end_f > d.literacy_f_median ? 10 : -10) + positionRegionLookup[d.name] - xPositionRegionScale(d.literacy_end_f))
        .attr("cy", d => -7 - ySizeRegionScale(d.literacy_end_f) + (pageHeight - pagePadding))
        .attr("r", 3)
        .attr("class", d => `region-marker ${colorRegionClass(d.name)}`);

    ///////////////////////////////////////////////////////////////////////
    //////////////////////////////// Hide /////////////////////////////////
    ///////////////////////////////////////////////////////////////////////

    // Step 0
    chartRegions.style("opacity", 0);
    // Step 1
    gWorld.style("opacity", 0);
    world.style("opacity", 0);
    gAxisCountries.style("opacity", 0);
    // Step 2
    polygonAbsFemaleCountries.style("opacity", 0);
    // Step 3
    polygonRelFemaleCountriesFront.style("opacity", 0);
    polygonRelFemaleCountriesBack.style("opacity", 0);
    // Step 4
    gAllMaleCountries.style("opacity", 0);
    // Step 5
    gYearsFemaleCountries.style("opacity", 0);
    // Step 6
    gPathLinksAverage.style("opacity", 0);
    gPathLinkCirclesAverage.style("opacity", 0);
    // Step 7
    gPathLinksMedian.style("opacity", 0);
    gPathLinkCirclesMedian.style("opacity", 0);
    circleAverageSide.style("opacity", 0);
        
});  // end d3

drawNext = (index, opacity) => {
    let 
        d = 600;

    if (index === 0) {
        chartRegions.transition().duration(d).style("opacity", opacity);
    } if (index === 1) {
        gWorld.transition().duration(d).style("opacity", opacity);
        world.transition().duration(d).style("opacity", opacity);
        gAxisCountries.transition().duration(d).style("opacity", opacity);
    } if (index === 2) {
        polygonAbsFemaleCountries.transition().duration(d).style("opacity", opacity);
    } if (index === 3) {
        polygonRelFemaleCountriesFront.transition().duration(d).style("opacity", opacity);
        polygonRelFemaleCountriesBack.transition().duration(d).style("opacity", opacity);
    } if (index === 4) {
        gAllMaleCountries.transition().duration(d).style("opacity", opacity);
    } if (index === 5) {
        gYearsFemaleCountries.transition().duration(d).style("opacity", opacity);
    } if (index === 6) {
        gPathLinksAverage.transition().duration(d).style("opacity", opacity);
        gPathLinkCirclesAverage.transition().duration(d).style("opacity", opacity);
    } if (index === 7) {
        gPathLinksMedian.transition().duration(d).style("opacity", opacity);
        gPathLinkCirclesMedian.transition().duration(d).style("opacity", opacity);
        circleAverageSide.transition().duration(d).style("opacity", opacity);
    } 
}

///////////////////////////////////////////////////////////////////////
/////////////////////////////// Scroll ////////////////////////////////
///////////////////////////////////////////////////////////////////////

let scroller = scrollama(),
    scrollContainer = d3.select("#scroll"),
        scrollGraphic = scrollContainer.select(".scroll-graphic"),
        scrollText = scrollContainer.select(".scroll-text"),
            step = scrollText.selectAll(".step");

let lastStep = 10;
scroller
    .setup({
        scroll: "#scroll",
        scrollGraphic: ".scroll-graphic",
        scrollText: ".scroll-text",
        step: ".step",
        progress: true,
        offset: 0,
        // debug: true,
    })
    .onStepEnter((response) => {
        // sticky the graphic
        if (response.index < lastStep) {
            scrollGraphic.classed('is-fixed', true);
            scrollGraphic.classed('is-bottom', false);
        }
        if (response.direction === "down") {
            drawNext(response.index, 1);
        }
        if (response.direction === "down" && response.index === 9) {
            scrollText.classed("hidden", true);
        }
    })
    .onStepExit((response) => {
        if (response.index === lastStep - 1 && response.direction === "down") {
            scrollGraphic.classed('is-fixed', false);
            scrollGraphic.classed('is-bottom', true);
        }
        if (response.index === 0 && response.direction === "up") {
            scrollGraphic.classed('is-fixed', false);
        }  
        if (response.direction === "up") {
            drawNext(response.index, 0);
        }   
        if (response.direction === "up" && response.index === 9) {
            scrollText.classed("hidden", false);
        }
    });