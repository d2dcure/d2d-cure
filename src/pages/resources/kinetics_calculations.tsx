//import React from 'react';
import {Breadcrumbs, BreadcrumbItem} from "@nextui-org/breadcrumbs";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
//import {Card, CardBody, CardFooter} from "@nextui-org/react";
//import {Button} from "@nextui-org/react";
//import Link from 'next/link';
//import { MdEmail } from "react-icons/md";
//import { FaLinkedin } from "react-icons/fa";
//import { Tabs, Tab } from "@nextui-org/react";

const HowParamsAreCalculated = () => {
	return (
		<>
			<NavBar />

			<div className="px-6 md:px-12 lg:px-24 py-8 lg:py-10 bg-white">
	    			<div className="col-span-1 items-center">
	      				<Breadcrumbs className="mb-4">
	        				<BreadcrumbItem href="/">Home</BreadcrumbItem>
	        				<BreadcrumbItem>Resources</BreadcrumbItem>
							<BreadcrumbItem>Kinetics Calculations</BreadcrumbItem>
	      				</Breadcrumbs>
	      				<div className="pt-6">
	        				<h1 className="mb-2 text-5xl md:text-5xl lg:text-6xl font-inter dark:text-white">
	          					Kinetics Calculations
	        				</h1>
	      				</div>
	    			</div>
  			</div>

			{/* Introduction */}			
			<div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					Kinetics is all about measuring rates.
				    	In chemistry, a <strong>reaction rate</strong> is defined as a change in concentration (<i>c</i>) over a change in time (<i>t></i>).
				    	Thus, rate can be defined mathematically as &Delta;<i>c</i>/&Delta;<i>t</i> for a range of time or 
				    	&delta;<i>c</i>/&delta;<i>t</i> for an instant of time. 
				    	In enzyme kinetics, things are no different; 
					we are concerned with the change in concentration of products (&delta;<i>c</i><sub>P</sub>) or subtrates (&delta;<i>c</i><sub>S</sub>) as an ezyme reaction progresses. 
					(If we are dealing with molar concentrations, 
					the convention is to use square brackets to indicate concentration, 
					such as &delta;[P]> or &delta;[S].)
			    	</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
        				Since we cannot see the actual molecules reacting inside an enzyme, 
					we must observe them indirectly, using an <strong>enzyme assay</strong>. 
					This assay often involves monitoring the change in color as a reaction progresses. 
					We then use the change in color to calculate the change in concentration.
				</p>
			</div>

			{/* Initial Velocity & the Beer–Lambert Law */}			
			<div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
				<h2 className="text-4xl font-light dark:text-white">Initial Velocity &amp; the Beer–Lambert Law</h2>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
    					Using the &beta;-glucosidase B (BglB) enzyme as an example, 
					because we are actually observing the release of <i>p</i>-nitrophenol 
					(<abbr title=para-nitrophenol>PNP</abbr>) from the substrate as the enzyme performs its reaction, 
					the initial rate, or <strong>initial &ldquo;velocity&rdquo;</strong> (<i>v</i>), that we are determining is 
					&delta;[<abbr title=para-nitrophenol>PNP</abbr>]/&delta;<abbr title=time><i>t</i></abbr>.
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					The initial rate/velocity is imporant&mdash;as opposed to the overall rate&mdash;
					because we need to have as close to an instanteous rate (&delta;<i>c</i><sub>P</sub>/&delta;<i>t</i>, 
					not &Delta;<i>c</i><sub>P</sub>/&Delta;<i>t</i>) as possible.
			        	We measure (or calculate) the initial velocity at the <em>beginning</em> of a reaction, 
					because at the start of an enzyme reaction there should be so much substrate 
					that every enzyme effectively instantly replaces any product molecule with a new substrate as soon as it &ldquo;turns over&rdquo;. 
    	        			This results in a concentration of product <i>versus</i> time curve with a steep, straight slope at the beginning of the reaction, 
					before the slope curves off (slows down) as the enzyme runs out of substrate to convert.
				</p>
				
				<figure class=center>
					<img 
						src=./sample_plots/steepest_slope.png 
						alt="Rate is equal to the change in concentration over the change in time, which is represented by the curves shown. The rate is fastest where the curve is steepest."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
					We cannot measure this initial velocity directly, 
					but it can be calculated from the <strong>steepest slope</strong> of 
					<strong>absorbance</strong> (<i>A</i>) of light over time at the <em>beginning</em> of a reaction, 
					because concentration is directly proportional to absorbance. 
					In our specific example case, we measure the slope of absorbance at 
					420&nbsp;<abbr title=nanometers>nm</abbr> 
					(the frequence of light best absorbed by <abbr title=para-nitrophenol>PNP</abbr>) 
					over minutes of the reaction. 
					This works because of the <a href=http://en.wikipedia.org/wiki/Beer%E2%80%93Lambert_law>Beer–Lambert law</a>, 
					which is a mathematical relationship between absorbance and concentration. 
					As an equation, the law is 
					<abbr title=absorbance><i>A</i></abbr> = <abbr title="extinction coefficient">&epsilon;</abbr><i>l</i><i>c</i>,
    	        			where <abbr title="extinction coefficient">&epsilon;</abbr> is the extinction coefficient in
    	        			<abbr title="inverse millimolar">m<span style="font-variant: small-caps">m</span><sup>&minus;1</sup></abbr>&nbsp;<abbr title="inverse centimeters">cm<sup>&minus;1</sup></abbr>,
    	        			<abbr title=length><i>l</i></abbr> is the path length in <abbr title=centimeters>cm</abbr>,
			    	        and <abbr title=concentration><i>c</i></abbr> is the concentration in <abbr title=millimolar>m<span style="font-variant: small-caps">m</span></abbr>.
    	        			Rearranging the Beer–Lambert law and using bracket notation ([<abbr title=para-nitrophenol>PNP</abbr>] =
    	        			<abbr title=concentration><i>c</i></abbr><sub><abbr title=para-nitrophenol>PNP</abbr></sub> =
    	        			<abbr title=absorbance><i>A</i></abbr><sub>420&nbsp;nm</sub>/<abbr title="extinction coefficient">&epsilon;</abbr><sub><abbr title=para-nitrophenol>PNP</abbr></sub><abbr title=length><i>l</i></abbr>),
    	        			we can calculate the rate of <abbr title=para-nitrophenol>PNP</abbr> release from the steepest slope<sup><a href=#note1>1</a></sup> as follows:</p>
				</p>					
				
				<figure class=center>
					<img 
						src=./equations/eq1.png 
						alt="Initial velocity/rate is equal to the change in concentration of PNP over the change in time, which is equal to the change in absorbance at 420 nm over the change in time over the extinction coefficient of PNP times path length, which is equal to the slope over the extinction coefficient of PNP times path length"
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
					In short, we simply need to divide the steepest slope from our absorbance versus time curves by the extinction coefficient, 
					which is a constant unique to each enzyme, 
					and adjust for pathlength of the light to obtain the initial velocity. 
            				Since absorbance, being the logarithm of the <em>ratio</em> of light transmitted and light received, 
					has no units,<sup><a href=#note2>2</a></sup> 
                			using the above equation provides a rate in units of m<span style="font-variant: small-caps">m</span>&nbsp;<abbr title=para-nitrophenol>PNP</abbr>/min, 
					if the provided slope is in inverse minutes.
				</p>
                		<p className="mt-4 text-gray-600 dark:text-gray-300">
					For example, if we measure an intitial steepest slope of <abbr title=absorbance><i>A</i></abbr><sub>420&nbsp;nm</sub>
                			of 1.80 min<sup>&minus;1</sup>:
				</p>

            			<figure class=center>
					<img 
						src=./equations/eq1ex.png 
						alt="Inital velocity/rate is equal to the change in concentration of PNP over the change in time, which is equal to the change in absorbance at 420 nm over the change in time over the extinction coefficient of PNP times path length, which is equal to the slope over the extinction coefficient of PNP times path length"
					>
				</figure>
			</div>

			{/* The Michaelis–Menten Equation */}			
			<div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
				<h2 className="text-4xl font-light dark:text-white">The Michaelis–Menten Equation</h2>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					Two scientists, Leonor Michaelis and Maud Menten, 
					found an equation that relates the initial velocity/rate (<i>v</i>) of an enzyme reaction, 
					which we just determined above, 
                			to the concentration of that enzyme&rsquo;s substrate, 
					and that equation is called the <strong>Michaelis–Menten equation</strong>:</p>
            			</p>

				<figure class=center>
					<img 
						src=./equations/eq0.png 
						alt="The initial velocity/rate is equal to the maximum velocity times the substrate concentration divided by the sum of the Michaelis constant and the substrate concentration."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
            				&hellip;where [S] is the molar substrate concentration.
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					<abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr><sup><a href=#note3>3</a></sup> 
					in the equation is <strong>maximum velocity</strong>.
                			It is the fastest rate that the enzyme can obtain under <strong>saturating conditions</strong>,
                			when we have far more substrate molecules than enzyme molecules, 
					such as at the beginning of a reaction.
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					The constant <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> in the equation 
					is called the <strong>Michaelis constant</strong>.
                			It has units of molar concentration 
					and represents the molarity of substrate for which the reaction rate is <em>half</em> of its maximal value.
                			It is an indication of how well an enzyme binds to a substrate, with <em>lower</em> values corresponding to tighter binding. 
					Think of it like this: 
					If an enzyme only needs a small concentration of substrate to react moderately quickly, 
					this likely means that the enzyme is really good at binding substrate molecules quickly.
				</p>
           			<p className="mt-4 text-gray-600 dark:text-gray-300">
					There is another very important value that is not actually given in the Michaelis–Menten equation.
                			The <strong>catalytic rate constant</strong>, <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>,
                			is the maximum number of product molecules released per molecule of enzyme per unit of time. 
					(For example, if 10 enzymes could create 100 product molecules in one second, 
					the <i>k</i><sub>cat</sub> for that enzyme would be 100/10/(1&nbsp;s) = 10&nbsp;s<sup>&minus;1</sup>.)
                			It is also called a &ldquo;turnover number&rdquo; 
					because it gives the number of substrate molecules turned over into product by a single enzyme molecule in a given unit of time.
                			<abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> is an indication of how good the enzyme is at performing the reaction,
                			with bigger values corresponding to faster enzymes.
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					More properly, <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> 
					is the <strong>rate constant</strong> of the chemical reaction 
					of the enzyme&ndash;substrate complex reacting to produce product and free enzyme. 
					(That&rsquo;s why its symbol is a lowercase <i>k</i>.) 
				</p>

				<figure class=center>
					<img 
						src=./equations/rxn.png 
						alt="E + S goes to ES, which goes to E + P."
					>
				</figure>	
						
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					It is a <strong>first-order rate constant</strong>,
                			which&mdash;if you remember second-semester General Chemistry&mdash;means that 
					the rate of the reaction depends primarily on <em>one</em> thing,
                			in this case, the enzyme&ndash;substrate (ES)) concentration.
					<em>If</em>, however, the reaction is performed under saturating conditions&mdash;such as 
					at the beginning of a reaction&mdash;we have so much S 
					that we assume that all of the enzyme is bound up with substrate to make ES.
					We assume that, at the beginning, [E] = [ES].
				</p>
                		<p className="mt-4 text-gray-600 dark:text-gray-300">
					Just like any other first-order rate constant in second-semester chemistry, 
                			<abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> can be used 
					in a <strong>rate law</strong> to give the rate of a reaction
                			from the concentration of reactant on which that rate constant depends, 
					which again, is enzyme.
					In this case, at saturating conditions, that rate law would be:
				</p>

				<figure class=center>
					<img 
						src=./equations/eq6.png 
						alt="Rate/velocity is equal to the catalytic rate constant times enzyme molarity."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
					The <em>maximum rate</em> (<abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr>) 
					of the reaction will happen at the initial moments of the reaction, 
					when the ES concentration is greatest and [ES] effectively is equal to the initial [E] ([E]<sub>0</sub>). 
					So, at saturating conditions:
				</p>

				<figure class=center>
					<img 
						src=./equations/eq6a.png 
						alt="Maximum rate is equal to the catalytic rate constant times initial enzyme molarity."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
            				<abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> is traditionally calculated 
					from <abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr><sup><a href=#note3>3</a></sup>
                			by simply dividing that maximum rate by the initial enzyme concentration: 
					<abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>&nbsp;=&nbsp;<abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr>⁄[E]<sub>0</sub>. 
					(<abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr> can be determined from the Michaelis–Menten equation 
					given above.)
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					<abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> and 
					<abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> values 
					are sometimes refered to as the <strong>kinetic parameters</strong> of an enzyme. 
					Before we go into the practicality of how one can calculate these values 
					using the Michaelis–Menten equation and its variations, 
					there is a third value/parameter of importance in enzyme kinetics, 
					the enzyme's <strong>specificty constant</strong>.
                			This is simply <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>/<abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr>.
                			The specificity constant is an indicator of how <em>efficient</em> the enzyme is.
                			Enzymes with high <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>/<abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> are efficient at what they do;
                			they have a good balance of binding substrates and turning them over quickly.
					Mathematically, the best possible <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>/<abbr title="Michaelis constant"><i>K</i><sub>M</sub> value
					must have both a big <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> value (fast catalysis) and
					a small <abbr title="Michaelis constant"><i>K</i><sub>M</sub> value (good substrate binding).
				</p>
			</div>

			{/* Appendix: Other Advanced Kinetics Terms */}			
			<div className="px-6 md:px-12 lg:px-24 py-16 bg-white">
				<h2 className="text-4xl font-light dark:text-white">Appendix: Other Advanced Kinetics Terms</h2>
				<h3>Activity &amp; Specific Activity</h3>
				<p className="mt-4 text-gray-600 dark:text-gray-300">		
					There are two other terms used by enzyme kineticists related to enzyme assays that can be defined here: 
					&ldquo;enzyme activity&rdquo; and &ldquo;specific activity&rdquo;.
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					The <strong>activity</strong> of an enzyme is 
					a measure of the <em>number of molecules</em> of substrate consumed (<i>n</i><sub>S</sub>) or 
					product released (<i>n</i><sub>P</sub>) over time,
                	(rather than <em>concentration</em>, <i>c</i>, over time). 
					Properly speaking, it is thus a kind of rate, 
					though not defined in the usual sense, 
					and it makes sense that a rate would be used to describe how active an enzyme is, 
					but this alternate definition that uses number instead of concentration might seem confusing at first. 
					Enzyme activity is usually reported in <strong>enzyme units</strong> (U), 
					which are defined as <abbr title=micormoles>μmol</abbr>/<abbr>min</abbr>.
				</p>
                <p className="mt-4 text-gray-600 dark:text-gray-300">
					Since molar concentration is moles per volume, 
					one can simply calculate the activity of an enzyme from its rate/velocity
					by multiplying the rate of product formation (<i>v</i>)
                	times the total volume (<abbr title="total volume"><i>V</i><sub>total</sub></abbr>) of the reaction mixture and 
					adjusting for a change in units:
				</p>
				
				<figure class=center>
					<img 
						src=./equations/eq2.png 
						alt="Activity is equal to rate times total volume."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
            		For example, if our total assay volume is 100&nbsp;<abbr title=microliters>μL</abbr> 
					and we have a rate of 200&nbsp;<abbr title="millimolar per minute">m<span style="font-variant: small-caps">m</span>/min</abbr>:
				</p>
            
            	<figure class=center>
					<img 
						src=./equations/eq2ex.png 
						alt="Activity is equal to rate times total volume, that is, to 0.2 enzyme units."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
					Activity depends on the amount of enzyme present, 
					and so a more useful value for comparisons, <strong>specific activity</strong>, is calculated,
                	which is a ratio of the enzyme’s activity over its mass, 
					usually expressed in units of <abbr title="enzyme units per milligram">U/mg</abbr>.
                	So, we need to know the <em>mass</em> of the enzyme for each specific experiment,
                	which we can find if we know both the concentration (in mass per volume, <em>not</em> molar) 
					and the volume of enzyme added to the reaction mixture.
				</p>

            	<figure class=center>
					<img 
						src=./equations/eq3.png 
						alt="Specific activity is equal to activity over the concentration of BglB times its volume."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
            		For example, if we have 25&nbsp;<abbr title=microliters>μL</abbr> of 
					a 1.00&nbsp;<abbr title="milligrams per milliliter">mg/mL</abbr> enzyme solution, then:
				</p>

            	<figure class=center>
					<img 
						src=./equations/eq3ex.png 
						alt="Specific activity is equal to activity over the concentration of BglB times its volume."
					>
				</figure>

				<p className="mt-4 text-gray-600 dark:text-gray-300">
					Specific activities are very often listed on reagent bottles, 
					when one orders an enzyme from a biochemical company. 
					They allow a biochemist to quickly determine how much enzyme to add to a reaction 
					to achieve the desired rate of reaction.
				</p>
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					If we know the molar mass of our enzyme, 
					we can also use the specific activity to determine the turnover numbers of enzymes,
					including <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>. 
					<abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> can be calculated 
					by multiplying the specific activity times the molar mass of the enzyme and converting units. 
                	For example, if our specific activity is 8&nbsp;<abbr title="enzyme units per milligram">U/mg</abbr>:
				</p>

            	<figure class=center>
					<img 
						src=./equations/eq4.png 
						alt="The observed rate constant is equal to the specific activity times the molar mass."
					>
				</figure>
            
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					Alternatively, one can also calculate <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> 
					from <em>activities</em> (instead of <em>specific</em> activities) in the following manner, 
					by dividing the activity by the number of enzyme molecules present:
				</p>
            
            	<figure class=center>
					<img 
						src=./equations/eq4alt.png 
						alt="The observed rate constant is equal to the activity divided by number of enzyme molecules."
					>
				</figure>
				
				<p className="mt-4 text-gray-600 dark:text-gray-300">
					Remember, to use <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>
					to calculate the <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>,
					one would need to know the maxiumum possible <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>
					for that enzyme, 
					which would be when that enzyme was fully saturated by substrate molecules. 
					So, activities and specific activities are useful for determining a specific rate
					from given conditions, 
					but not for determining the maximum possible rate ((<abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr>))
					that an enzyme can achieve at saturating conditions.
					In other words, <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> can be calculated from specific activity 
					if and only if the enzyme assay to determine the specific activity was performed at saturating conditions. 
					For this reason, when using a specific activity listed on a reagent bottle,
					always be sure to confirm under which conditions that value was determined!
				</p>
                
		    <Footer />
		</>
	);
};

export default HowParamsAreCalculated;

/*<!DOCTYPE html>
<html lang="en-US">
	<head>
		<title>D2D CURE | Data | Kinetics Calculations</title>

		<meta name="description" content="Page describing the kinetics calculations used to generate the data for the D2D CURE database">
		<meta name="keywords" content="">
		<meta charset=UTF-8>
		<meta name=viewport content="width=device-width, initial-scale=1.0">
        <meta http-equiv=X-UA-Compatible content="ie=edge">
		<meta name=author content="Jason William Labonte">
		<link rel=stylesheet href=/normalize.css type=text/css>
		<link rel=stylesheet href=/style.css type=text/css>
        <link rel="shortcut icon" href=/favicon.ico type=image/gif>
	</head>
	
	<body>
   	<main>
            <p><abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> and <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr>
                values can be determined a number of ways. From either plots of rate <i>vs.</i> substrate concentration
                or plots of observed rate constants (<abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>, see below) <i>vs.</i> substrate concentration,
                <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> can be found by finding the value on the <i>x</i> axis where
                rate or <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> are at half their maximum value, respectively.</p>
            
            <p>Alternatively, one can use the <a href=https://en.wikipedia.org/wiki/Lineweaver%E2%80%93Burk_plot>Lineweaver–Burk method</a>,
                which is described in the next section.</p>
            
            <h3>Lineweaver–Burk Method</h3>
            
            <p>To be written...</p>
            
            <p>While this website displays Lineweaver–Burk plots for reference, the actual kinetic constants are calculated using curve-fitting software,
                from plots of <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> <i>vs.</i> substrate concentration, which provide more accurate values.
                This process is described below.</p>
            
            <h3>Other Advanced Kinetics Terms & Methods</h3>
            <h4>Activity &amp; Specific Activity</h4>
            
            <h4>Alternative Ways to Determine Turnover Numbers &amp; Rate Constants</h4>

            <p>The <strong>observed rate constant</strong>, <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>,
                is the ratio of the rate over the initial enzyme concentraion, <i>rate</i>/[E]<sub>0</sub>.
                
            <p>We must be careful, though, not to mix up the initial molar enzyme concentration, [E]<sub>0</sub>, in the reaction mixture
                with the molar concentration of our enzyme solution <em>before</em> we have added it to our reaction mixture.
                If we want to calculate <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> directly from enzyme rate,
                we need to adjust for the change in concentration upon mixing.
                (Do you remember the equation <i>M</i><sub>1</sub><i>V</i><sub>1</sub> = <i>M</i><sub>2</sub><i>V</i><sub>2</sub>?)
                For example, if we use the example of the stock enzyme solution from before with a concentration of 1&nbsp;mg/mL, if its molar mass is 50&nbsp;kDa, then this
                corresponds to a molar concentration of 0.02&nbsp;m<span style="font-variant: small-caps">m</span>.
                If we add 25&nbsp;μL to our reaction mixture to have a total reaction volume of 100&nbsp;μL,
                then our [E]<sub>0</sub> would be 0.005&nbsp;m<span style="font-variant: small-caps">m</span>. So:</p>
                
            <figure class=center><img src=./equations/eq4simple.png alt="The observed rate constant is equal to the rate divided by intial molar enzyme concentration."></figure>
                
           
            <p>What is nice about this value is that <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>,
                like the catalytic rate constant <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>, is a turnover number.
                The units of any turnover number are inverse time. Like <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>,
                it <em>actually</em> is an expression of the number of product molecules released (or substrate molecules consumed) per molecule of enzyme per unit of time,
                but the units of number of product molecules and number of enzyme molecules cancel out.</p>
            
            <figure class="right"><img src=../images/sample_plot.png alt="A plot of observed rate constant in inverse minutes versus substrate concentration in molar." width=300px></a></figure>

            <p>The catalytic rate constant, <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>, which we defined above,
                is, again, the <em>maximum</em> number of product molecules released per molecule of enzyme per unit of time.
                It is the <em>maximum</em> turnover number possible for an enzyme.
                Thus, it is simply the <em>maximum</em> <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> value determined.
                To find <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> with this method,
                we simply find the maximum <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> value from a plot of
                <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> <i>vs.</i> substrate concentration.</p>
                
            <p>For example, in the plot shown here, the maximum <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> might be estimated as close to 500&nbsp;min<sup>&minus;1</sup>. 
                So, the <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> is 500&nbsp;min<sup>&minus;1</sup>.</p>
                
            <p>Half that value is 250&nbsp;min<sup>&minus;1</sup>, and the value of [S] at that <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> value
                is approximately 0.01&nbsp;<span style="font-variant: small-caps">m</span>. So the <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr>
                in this example can be estimated to be 0.01&nbsp;<span style="font-variant: small-caps">m</span>.</p>
                
            <p>Curve fitting algorithms are used to find the actual constants, by fitting the following equation to the curve:</p>
            
            <figure class=center><img src=./equations/eq5.png alt="The observed rate constant is equal to the catalytic rate constant times the substrate concentration 
                divided by the sum of the Michaelis constant and the substrate concentration."></figure>
            
            <p>Notice how similar this equation is to the Michaelis–Menten equation shown above!
                You can get the Michaelis–Menten equation back by multiplying both <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> and
                <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> by [E]<sub>0</sub>.</p>
            
            <hr>
            
            <small>
                <sup><a id=note1>1</a></sup>&nbsp;
                Slope here is the initial slope of a curve of absorbance over time during the initial rate component of saturating conditions.
                Some instruments confusingly report this slope as “Max V” because it is the steepest slope (velocity) of any line fit to the data during measurement.<br>
                <br>
                <sup><a id=note2>2</a></sup>&nbsp;
                Many scientists wrongly use a synonym for absorbance (<abbr title=absorbance><i>A</i></abbr>), optical density (OD), as if it were a unit,
                for example recording an absorbance of “0.500&nbsp;OD” instead of simply 0.500. This problem is enhanced by the fact that many instruments provide values in mOD,
                that is “milliOD”, so a measurement reported by such a machine with an absorbance of “500&nbsp;mOD” is in fact an absorbance of 0.500.<br>
                <br>
                <sup><a id=note3>3</a></sup>&nbsp;
                <abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr> is used here (for maximum velocity) instead of the more common
                <abbr title="maximum velocity"><i>V</i><sub>max</sub></abbr> to avoid confusion with volume.
                This is also a completely different value from “Max V” reported by some instruments. For an explanation of “Max V” see <a href=#note1>footnote 1</a>.<br>
            </small>

        </main>
		
	</body>
</html>
*/
