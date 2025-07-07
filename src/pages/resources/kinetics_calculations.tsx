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
    	<header>
            <div class=title>
                <a href=/>
                    <img src=/D2D_header.png height=160px>
            	</a>
            </div>
            <nav>
                <div class=dropmenu>
                    <a class=nav-link href=/database>Database </a>
                    <div class=dropmenu-content>
                        <div class=content-inner>
                            <a href=/data?protein=BglB>BglB Characterization</a><br>
                        </div>
                    </div>
                </div>
                <div class=dropmenu>
                    <a class=nav-link href=/resources>Resources </a>
                    <div class=dropmenu-content>
                        <div class=content-inner>
                            <a href=/resources#structures>Structure Files</a><br>
                            <a href=/resources/oligo_search/>Oligo Search</a><br>
                            <a href=/resources/publications/>Publications</a><br>
                        </div>
                    </div>
                </div>
                <div class=dropmenu>
                    <a class=nav-link href=/about>About </a>
                    <div class=dropmenu-content>
                        <a href=/about#D2D>D2D CURE</a><br>
                        <a href=/stats>Network Statistics</a><br>
                        <a href=/about#BglB>BglB</a><br>
                    </div>
                </div>
                <a href=/login>Login&nbsp;<img src=/icons/User_logged_out.png alt="login icon" width=18px height=18px></a>
            </nav>
    	</header>
    	
    	<main>
            <h2>Kinetics Calculations</h2>

            <p>Kinetics is all about measuring rates. In chemistry, a <strong>reaction rate</strong> is defined as change in concentration over change in time.
                In enzyme kinetics, things are no different; we are concerned with the change in concentration of products or subtrates as an ezyme reaction progresses.</p>
                
            <p>Since we cannot see the actual molecules reacting inside an enzyme, we must observe them indirectly, using an <strong>enzyme assay</strong>.
                This assay often involves monitoring the change in color as a reaction progresses.</p>
            
            <h3>Initial Velocity &amp; the Beer–Lambert Law</h3>
            
    	    <p>In our case, because we are actually observing the release of <i>p</i>-nitrophenol
    	        (<abbr title=para-nitrophenol>PNP</abbr>) from the substrate as the enzyme
    	        performs its reaction, the initial rate, or <strong>initial velocity</strong>, that we are determining
    	        is &delta;[<abbr title=para-nitrophenol>PNP</abbr>]/&delta;<abbr title=time><i>t</i></abbr>.</p>

            <p>We cannot measure this directly, but it can be calculated from the <strong>steepest slope</strong> of absorbance over time at the beginning of a reaction.
    	        In our case, we measure the slope of absorbance at 420&nbsp;nm over minutes of the reaction.
    	        Then, we use the <a href=http://en.wikipedia.org/wiki/Beer%E2%80%93Lambert_law>Beer–Lambert law</a>,
    	        which is <abbr title=absorbance><i>A</i></abbr> = <abbr title="extinction coefficient">&epsilon;</abbr><i>l</i><i>c</i>,
    	        where <abbr title="extinction coefficient">&epsilon;</abbr> is the extinction coefficient in
    	        m<span style="font-variant: small-caps">m</span><sup>&minus;1</sup> cm<sup>&minus;1</sup>,
    	        <abbr title=length><i>l</i></abbr> is the path length in cm,
    	        and <abbr title=concentration><i>c</i></abbr> is the concentration in m<span style="font-variant: small-caps">m</span>.
    	        Rearranging the Beer–Lambert law ([<abbr title=para-nitrophenol>PNP</abbr>] =
    	        <abbr title=concentration><i>c</i></abbr><sub><abbr title=para-nitrophenol>PNP</abbr></sub> =
    	        <abbr title=absorbance><i>A</i></abbr><sub>420&nbsp;nm</sub>/<abbr title="extinction coefficient">&epsilon;</abbr><sub><abbr title=para-nitrophenol>PNP</abbr></sub><abbr title=length><i>l</i></abbr>),
    	        we can calculate the rate of <abbr title=para-nitrophenol>PNP</abbr> release from the steepest slope<sup><a href=#note1>1</a></sup> as follows:</p>

            <figure class=center><img src=./equations/eq1.png alt="Rate is equal to the change in concentration of PNP over the change in time, which is equal to the change in absorbance at 420 nm over the change in time over the extinction coefficient of PNP times path length, which is equal to the slope over the extinction coefficient of PNP times path length"></figure>

            <p>Since absorbance, being the logarithm of the ratio of light transmitted and light received, has no units,<sup><a href=#note2>2</a></sup>
                using the above equation provides a rate in units of m<span style="font-variant: small-caps">m</span> <abbr title=para-nitrophenol>PNP</abbr>/min, if the provided slope is in inverse minutes.</p>
                
            <p>For example, if we measure an intitial steepest slope of <abbr title=absorbance><i>A</i></abbr><sub>420&nbsp;nm</sub>
                of 1.80 min<sup>&minus;1</sup>:</p>

            <figure class=center><img src=./equations/eq1ex.png alt="Rate is equal to the change in concentration of PNP over the change in time, which is equal to the change in absorbance at 420 nm over the change in time over the extinction coefficient of PNP times path length, which is equal to the slope over the extinction coefficient of PNP times path length"></figure>

            <h3>The Michaelis–Menten Equation</h3>
            
            <p>Two scientists, Leonor Michaelis and Maud Menten found an equation that relates the rate of an enzyme reaction, which we just determined above,
                to the concentration of that enzyme&rsquo;s substrate, and that equation is called the <strong>Michaelis–Menten equation</strong>:</p>
            
            <figure class=center><img src=./equations/eq0.png alt="The rate is equal to the maximum velocity times the substrate concentration 
                divided by the sum of the Michaelis constant and the substrate concentration."></figure>
                
            <p>&hellip;where [S] is the molar substrate concentration.</p>
                
            <p><abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr><sup><a href=#note3>3</a></sup> in the equation is <strong>maximum velocity</strong>.
                It is the fastest rate that the enzyme can obtain under <strong>saturating conditions</strong>,
                when we have far more substrate molecules than enzyme molecules.</p>
            
            <p>The constant <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> in the equation is called the <strong>Michaelis constant</strong>.
                It has units of molar concentration and represents the molarity of substrate for which the reaction rate is half of its maximal value.
                It is an indication of how well an enzyme binds to a substrate, with <em>lower</em> values corresponding to tighter binding.</p>
            
            <p>There is another very important value that is not actually given in the Michaelis–Menten equation.
                The <strong>catalytic rate constant</strong>, <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>,
                is the maximum number of product molecules released per molecule of enzyme per unit of time.
                It is also called a &ldquo;turnover number&rdquo; because it gives the number of substrate molecules turned over into product by a single enzyme molecule in a given unit of time.
                <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> is an indication of how good the enzyme is at performing the reaction,
                with bigger values corresponding to faster enzymes.</p>
            
            <p>Properly, <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> is the rate constant of the chemical reaction of the enzyme&ndash;substrate complex
                reacting to produce product and free enzyme.</p>
                
            <figure class=center><img src=./equations/rxn.png alt="E + S goes to ES, which goes to E + P."></figure>
                
            <p>It is a <strong>first-order rate constant</strong>,
                which&mdash;if you remember second-semester General Chemistry&mdash;means that the rate of the reaction depends primarily on one thing,
                in this case, enzyme concentration, <em>if</em> the reaction is performed under saturating conditions.
                Under saturating conditions, we have so much S, that we assume that all of the enzyme is bound up with substrate to make ES.</p>
                
            <p>Just like any other first-order rate constant in chemistry,
                <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> can be used in a <strong>rate law</strong> to give the rate of a reaction
                from the concentration of reactant on which that rate constant depends, which again, is enzyme.
                In this case, at saturating conditions, that rate law would be:</p>
                
            <figure class=center><img src=./equations/eq6.png alt="Rate is equal to the catalytic rate constant times enzyme molarity."></figure>
            
            <p>The maximum rate of the reaction will happen at the initial moments of the reaction, when the ES concentration is greatest,
                and [ES] effectively is equal to the initial [E]. So, at saturating conditions:</p>
            
            <figure class=center><img src=./equations/eq6a.png alt="Maximum rate is equal to the catalytic rate constant times initial enzyme molarity."></figure>
                
            <p><abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> is traditionally calculated from <abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr><sup><a href=#note3>3</a></sup>
                by dividing that maximum rate by the initial enzyme concentration: <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> =
                <abbr title="maximum velocity"><i>v</i><sub>max</sub></abbr>⁄[E]<sub>0</sub>.</p>
            
            <p><abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr> and <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr>
                values can be determined a number of ways. From either plots of rate <i>vs.</i> substrate concentration
                or plots of observed rate constants (<abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr>, see below) <i>vs.</i> substrate concentration,
                <abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> can be found by finding the value on the <i>x</i> axis where
                rate or <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> are at half their maximum value, respectively.</p>
            
            <p>Alternatively, one can use the <a href=https://en.wikipedia.org/wiki/Lineweaver%E2%80%93Burk_plot>Lineweaver–Burk method</a>,
                which is described in the next section.</p>
            
            <p>Before we explain that, however, there is a third value of importance in enzyme kinetics, the enzyme's <strong>specificty constant</strong>.
                This is simply <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>/<abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr>.
                The specificity constant is an indicator of how efficient the enzyme is.
                Enzymes with high <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>/<abbr title="Michaelis constant"><i>K</i><sub>M</sub></abbr> are efficient at what they do;
                they have a good balance of binding substrates and turning them over quickly.</p>
            
            <h3>Lineweaver–Burk Method</h3>
            
            <p>To be written...</p>
            
            <p>While this website displays Lineweaver–Burk plots for reference, the actual kinetic constants are calculated using curve-fitting software,
                from plots of <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> <i>vs.</i> substrate concentration, which provide more accurate values.
                This process is described below.</p>
            
            <h3>Other Advanced Kinetics Terms & Methods</h3>
            <h4>Activity &amp; Specific Activity</h4>
            
            <p>There are two other terms used by enzyme kineticists related to enzyme assays that can be defined here: &ldquo;enzyme activity&rdquo; and &ldquo;specific activity&rdquo;.</p>
            
            <p>The <strong>activity</strong> of an enzyme is a measure of the <em>number of molecules</em> of substrate consumed or product released over time,
                (rather than <em>concentration</em> over time). 
                Enzyme activity is usually reported in <strong>enzyme units</strong> (U), which are equivalent to μmol/min.</p>
                
            <p>In our case, it is simply calculated by multiplying the rate of <abbr title=para-nitrophenol>PNP</abbr> production
                times the volume (<abbr title=volume><i>V</i></abbr>) of the reaction mixture and adjusting for a change in
                units.</p>

            <figure class=center><img src=./equations/eq2.png alt="Activity is equal to rate times total volume."></figure>

            <p>For example, if our assay volume is 100 μL and we have a rate of 200 m<span style="font-variant: small-caps">m</span>/min:</p>
            
            <figure class=center><img src=./equations/eq2ex.png alt="Activity is equal to rate times total volume."></figure>

            <p>Activity depends on the amount of enzyme present, and so <strong>specific activity</strong> is calculated,
                which is a ratio of the enzyme’s activity over its mass, usually expressed in units of U/mg.
                So, we need to know the mass of the enzyme for each specific experiment,
                which we can find if we know the concentration (in mass per volume, <em>not</em> molar) and the volume of enzyme added to the reaction mixture.</p>

            <figure class=center><img src=./equations/eq3.png alt="Specific activity is equal to activity over the concentration of BglB times its volume."></figure>

            <p>For example, if we have 25&nbsp;μL of a 1.00&nbsp;mg/mL enzyme solution, then:</p>

            <figure class=center><img src=./equations/eq3ex.png alt="Specific activity is equal to activity over the concentration of BglB times its volume."></figure>

            <p>If we know the molar mass of our enzyme, we can use the specific activity to determine the turnover numbers of enzymes,
                including <abbr title="catalytic rate constant"><i>k</i><sub>cat</sub></abbr>, as described next.</p>

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
                
            <p>One can also calculate <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> from activities in the following manner, by dividing
                the activity by the number of enzyme molecules present:</p>
            
            <figure class=center><img src=./equations/eq4alt.png alt="The observed rate constant is equal to the activity divided by number of enzyme molecules."></figure>
                
            <p>Alternatively, <abbr title="observed rate constant"><i>k</i><sub>obs</sub></abbr> can be calculated by multiplying the specific activity times the molar mass of the enzyme and converting units.
                For example, if our specific activity is 8&nbsp;U/mg:</p>

            <figure class=center><img src=./equations/eq4.png alt="The observed rate constant is equal to the specific activity times the molar mass."></figure>
            
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
		
		<footer>
                        <hr>
            D2D CURE &copy; 2018&ndash;2025 ~ 
            The D2D CURE Program is supported by the
            <a href="http://www.nsf.gov/awardsearch/showAward?AWD_ID=1827246">National Science Foundation's Undergraduate Biology Education IUSE Program, award number 1827246</a>.
            <address>Website maintained by <a href="mailto:webmaster@d2dcure.com?subject=D2DCure%20Website%20Issues">Jason William Labonte</a>. Page updated: 2022.02.05</address>
            <a href=http://www.nsf.gov/ target=_blank title="Logo of the National Science Foundation"><img src=/images/NSF_logo.png alt="Logo of the NSF" height=36px></a>&nbsp;&#32;&nbsp;
            <a href=http://serc.carleton.edu/curenet/ target=_blank title="Logo of CUREnet"><img src=/images/CUREnet_logo.png alt="Logo of CUREnet" height=36px></a>&nbsp;&#32;&nbsp;
            <a href=http://www.ucdavis.edu/ target=_blank title="Logo of the University of California, Davis"><img src="/images/UC Davis_logo.png" alt="Logo of UC Davis" height=36px></a>&nbsp;&#32;&nbsp;
            <a href=http://www.rosettacommons.org/ target=_blank title="Logo of the RosettaCommons"><img src=/people/Rosetta_logo.png alt="Logo of the RosettaCommons" height=36px></a>&nbsp;&#32;&nbsp;
            <span id="siteseal"><script async type="text/javascript" src="https://seal.starfieldtech.com/getSeal?sealID=1Fg6afsputuP5L0Y6uqRnIMTPqJUKBfoyRnlHgMU1ieNioMXFHJTtT7chvO0"></script></span>
            <details>
                <summary>Participating Institutions</summary>
                <a href=http://www.jhu.edu/ target=_blank title="Logo of Johns Hopkins University"><img src="/images/JHU_logo.png" alt="JHU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.hamline.edu/ target=_blank title="Logo of Hamline University"><img src="/images/Hamline_logo.png" alt="Hamline" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.tmcc.edu/ target=_blank title="Logo of Truckee Meadows Community College"><img src="/images/TMCC_logo.png" alt="TMCC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.fiu.edu/ target=_blank title="Logo of Florida International University"><img src="/images/FIU_logo.png" alt="FIU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.uga.edu/ target=_blank title="Logo of University of Georgia"><img src="/images/UGA_logo.png" alt="UGA" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.lewisu.edu/ target=_blank title="Logo of Lewis University"><img src="/images/Lewis_logo.png" alt="Lewis" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.capitalcc.edu/ target=_blank title="Logo of Capital Community College"><img src="/images/CCC_logo.png" alt="CCC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.miracosta.edu/ target=_blank title="Logo of MiraCosta College"><img src="/images/MiraCosta_logo.png" alt="MiraCosta" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.augustana.edu/ target=_blank title="Logo of Augustana College"><img src="/images/Augustana_logo.png" alt="Augustana" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.unlv.edu/ target=_blank title="Logo of University of Nevada, Las Vegas"><img src="/images/UNLV_logo.png" alt="UNLV" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.crown.edu/ target=_blank title="Logo of Crown College"><img src="/images/Crown_logo.png" alt="Crown" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://wayne.edu/ target=_blank title="Logo of Wayne State University"><img src="/images/Wayne_logo.png" alt="Wayne" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.jccc.edu/ target=_blank title="Logo of Johnson County Community College"><img src="/images/JCCC_logo.png" alt="JCCC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.mercy.edu/ target=_blank title="Logo of Mercy College"><img src="/images/Mercy_logo.png" alt="Mercy" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.taylor.edu/ target=_blank title="Logo of Taylor University"><img src="/images/Taylor_logo.png" alt="Taylor" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.mjc.edu/ target=_blank title="Logo of Modesto Junior College"><img src="/images/MJC_logo.png" alt="MJC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.cnm.edu/ target=_blank title="Logo of Central New Mexico Community College"><img src="/images/CNM_logo.png" alt="CNM" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.css.edu/ target=_blank title="Logo of The College of St. Scholastica"><img src="/images/CSS_logo.png" alt="CSS" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.duny.edu/ target=_blank title="Logo of Dominican University New York"><img src="/images/DUNY_logo.png" alt="DUNY" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.unh.edu/ target=_blank title="Logo of University of New Hampshire"><img src="/images/UNH_logo.png" alt="UNH" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.colostate.edu/ target=_blank title="Logo of Colorado State University"><img src="/images/CSU_logo.png" alt="CSU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.luc.edu/ target=_blank title="Logo of Loyola University Chicago"><img src="/images/LUC_logo.png" alt="LUC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.campbell.edu/ target=_blank title="Logo of Campbell University"><img src="/images/Campbell_logo.png" alt="Campbell" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.geneseo.edu/ target=_blank title="Logo of State University of New York at Geneseo"><img src="/images/SUNY Geneseo_logo.png" alt="SUNY Geneseo" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://kwc.edu/ target=_blank title="Logo of Kentucky Wesleyan College"><img src="/images/KWC_logo.png" alt="KWC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.uah.edu/ target=_blank title="Logo of University of Alabama, Huntsville"><img src="/images/UAH_logo.png" alt="UAH" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.saddleback.edu/ target=_blank title="Logo of Saddleback College"><img src="/images/Saddleback_logo.png" alt="Saddleback" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.yale.edu/ target=_blank title="Logo of Yale University"><img src="/images/Yale_logo.png" alt="Yale" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.umw.edu/ target=_blank title="Logo of University of Mary Washington"><img src="/images/UMW_logo.png" alt="UMW" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.vsu.edu/ target=_blank title="Logo of Virginia State University"><img src="/images/VSU_logo.png" alt="VSU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.unf.edu/ target=_blank title="Logo of University of North Florida"><img src="/images/UNF_logo.png" alt="UNF" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://lasierra.edu/ target=_blank title="Logo of La Sierra University"><img src="/images/La Sierra_logo.png" alt="La Sierra" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.fresnostate.edu/ target=_blank title="Logo of California State University, Fresno"><img src="/images/CSU Fresno_logo.png" alt="CSU Fresno" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.highlands.edu/ target=_blank title="Logo of Georgia Highlands College"><img src="/images/GHC_logo.png" alt="GHC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.jooust.ac.ke/ target=_blank title="Logo of Jaramogi Oginga Odinga University of Science and Technology"><img src="/images/JOOUST_logo.png" alt="JOOUST" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.kckcc.edu/ target=_blank title="Logo of Kansas City Kansas Community College"><img src="/images/KCKCC_logo.png" alt="KCKCC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.marian.edu/ target=_blank title="Logo of Marian University"><img src="/images/Marian_logo.png" alt="Marian" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.hofstra.edu/ target=_blank title="Logo of Hofstra University"><img src="/images/Hofstra_logo.png" alt="Hofstra" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.nsu.edu/ target=_blank title="Logo of Norfolk State University"><img src="/images/NSU_logo.png" alt="NSU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.smith.edu/ target=_blank title="Logo of Smith College"><img src="/images/Smith_logo.png" alt="Smith" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.creighton.edu/ target=_blank title="Logo of Creighton University"><img src="/images/Creighton_logo.png" alt="Creighton" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.juniata.edu/ target=_blank title="Logo of Juniata College"><img src="/images/Juniata_logo.png" alt="Juniata" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.gettysburg.edu/ target=_blank title="Logo of Gettysburg College"><img src="/images/Gettysburg_logo.png" alt="Gettysburg" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.regis.edu/ target=_blank title="Logo of Regis University"><img src="/images/Regis_logo.png" alt="Regis" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.ecu.edu/ target=_blank title="Logo of East Carolina University"><img src="/images/ECU_logo.png" alt="ECU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.polyu.edu.hk/ target=_blank title="Logo of The Hong Kong Polytechnic University"><img src="/images/PolyU_logo.png" alt="PolyU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.umass.edu/ target=_blank title="Logo of University of Massachusetts Amherst"><img src="/images/UMass Amherst_logo.png" alt="UMass Amherst" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.carthage.edu/ target=_blank title="Logo of Carthage College"><img src="/images/Carthage_logo.png" alt="Carthage" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.missouriwestern.edu/ target=_blank title="Logo of Missouri Western State University"><img src="/images/MWSU_logo.png" alt="MWSU" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.elmhurst.edu/ target=_blank title="Logo of Elmhurst University"><img src="/images/Elmhurst_logo.png" alt="Elmhurst" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.mines.edu/ target=_blank title="Logo of Colorado School of Mines"><img src="/images/Mines_logo.png" alt="Mines" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.southmountaincc.edu/ target=_blank title="Logo of South Mountain Community College"><img src="/images/SMCC_logo.png" alt="SMCC" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://www.unr.edu/ target=_blank title="Logo of University of Nevada, Reno"><img src="/images/UNR_logo.png" alt="UNR" height=36px></a>&nbsp;&#32;&nbsp;
                <a href=http://ku.edu/ target=_blank title="Logo of University of Kansas"><img src="/images/KU_logo.png" alt="KU" height=36px></a>&nbsp;&#32;&nbsp;
            </details>
        </footer>
	</body>
</html>
*/