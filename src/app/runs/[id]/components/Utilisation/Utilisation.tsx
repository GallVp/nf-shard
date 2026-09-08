import { ProgressIndicator } from "../ProgressIndicator/ProgressIndicator"
import { Container } from "@/app/components"
import { TaskAggregate } from "@/services/prisma"

type UtilisationProps = {
	aggregate: TaskAggregate
	peakCpus: number
	loadCpus: number
	className?: string
}

export const Utilisation: React.FC<UtilisationProps> = (props: UtilisationProps) => {
	return (
		<Container sectionName="Utilisation & Load" className={props.className}>
			<div className="flex flex-col pb-10 text-black">
				<div className="flex">
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<ProgressIndicator percent={props.aggregate.memoryEfficiencyPct} />
							<h1 className="text-m mb-4">Memory efficiency</h1>
						</div>
					</div>

					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<ProgressIndicator percent={props.aggregate.cpuEfficiencyPct} />
							<h1 className="text-m mb-4">CPU efficiency</h1>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-col border-t border-gray-900/5 pt-10 text-black">
				<div className="flex">
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<ProgressIndicator
								percent={props.peakCpus === 0 ? 0 : (props.loadCpus / props.peakCpus) * 100}
								text={`${props.loadCpus}/${props.peakCpus}`}
							/>
							<h1 className="text-m mb-4">Cores</h1>
						</div>
					</div>

					<div className="flex-1 flex items-center justify-center">
						<div className="text-center">
							<ProgressIndicator
								percent={
									props.aggregate.totalTaskCount === 0
										? 0
										: (props.aggregate.completedTaskCount / props.aggregate.totalTaskCount) * 100
								}
								text={`${props.aggregate.completedTaskCount}/${props.aggregate.totalTaskCount}`}
							/>
							<h1 className="text-m mb-4">Tasks</h1>
						</div>
					</div>
				</div>
			</div>
		</Container>
	)
}
